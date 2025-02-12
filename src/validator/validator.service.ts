import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { CLIENT_RENEG_LIMIT } from 'tls'
import { keccak256 } from 'js-sha3'
import { ConfigService } from '@nestjs/config'

interface GetWalletProof {
  wallet_address: string
  score: string
  index: string
  proof: string[]
}

interface GetRandWallets {
  wallet_addresses: string[]
}

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name)
  zscoreDbServerUrl: string
  constructor(private readonly configService: ConfigService) {
    this.zscoreDbServerUrl = this.configService.get<string>(
      'ZSCORE_DB_SERVER_URL'
    )!
  }

  async validateWallets(): Promise<{ isApproved: boolean }> {
    try {
      const walletProofs = await this.fetchWalletData()
      const { root } = await (
        await axios.get(`${this.zscoreDbServerUrl}/leaf/root`)
      ).data

      if (!walletProofs || walletProofs.length !== 3) {
        this.logger.error('Invalid wallet data received from external API')
        throw new HttpException(
          'Invalid wallet data received from external API',
          HttpStatus.BAD_REQUEST
        )
      }

      let validWalletCount = 0

      for (const wallet of walletProofs) {
        try {
          const isValid = this.verifyMerkleProof(
            wallet.proof,
            root,
            wallet.wallet_address,
            wallet.score,
            wallet.index
          )

          console.log({ isValid })

          if (isValid) {
            validWalletCount++
          }

          this.logger.debug(
            `Wallet ${wallet.wallet_address} validation result: ${isValid}`
          )
        } catch (error) {
          this.logger.error(
            `Error validating wallet ${wallet.wallet_address}: ${error.message}`
          )

          continue
        }
      }

      return { isApproved: validWalletCount >= 2 }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }

      this.logger.error(`Error in validateWallets: ${error.message}`)
      throw new HttpException(
        'Error validating wallets',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  private async fetchWalletData(): Promise<GetWalletProof[]> {
    try {
      const url = `${this.zscoreDbServerUrl}/leaf/rand?seed=${this.getSeed()}`
      const response = await axios.get<GetRandWallets>(url)
      const proofReqs = []
      for (let wallet of response.data.wallet_addresses) {
        let url = `${this.zscoreDbServerUrl}/leaf/score?wallet_address=${wallet}`
        proofReqs.push(axios.get<GetWalletProof>(url))
      }

      return (await Promise.all(proofReqs)).map((res) => res.data)
    } catch (error) {
      this.logger.error(`Error fetching wallet data: ${error.message}`)
      throw new HttpException(
        'Failed to fetch wallet data from external API',
        HttpStatus.BAD_GATEWAY
      )
    }
  }

  private verifyMerkleProof(
    proof: string[],
    root: string,
    walletAddress: string,
    score: string,
    index: string
  ): boolean {
    const proofBuffers = proof.map(this.hexToBuffer)
    const rootBuffer = this.hexToBuffer(root)

    const leaf = this.hashLeaf(walletAddress, score, index)

    return this.verifyProof(leaf, proofBuffers, rootBuffer, index)
  }

  private getSeed(): string {
    return (Math.floor(Math.random() * 10_000_000) + 1).toString()
  }

  private hashLeaf(walletAddress: string, score: any, index: any) {
    const leafObject = {
      wallet_address: walletAddress,
      score: score,
      index: index,
    }
    const leafString = JSON.stringify(leafObject)
    console.log(leafString)
    const hashHex = keccak256(leafString)
    return Buffer.from(hashHex, 'hex')
  }

  private verifyProof(leaf: any, proof: any[], root: any, index: any) {
    let computedHash = leaf

    for (const sibling of proof) {
      if (index % 2 === 0) {
        computedHash = Buffer.from(
          keccak256.arrayBuffer(Buffer.concat([computedHash, sibling]))
        )
      } else {
        computedHash = Buffer.from(
          keccak256.arrayBuffer(Buffer.concat([sibling, computedHash]))
        )
      }

      index = Math.floor(index / 2)
    }

    return computedHash.equals(root)
  }

  private hexToBuffer(hexString: string) {
    return Buffer.from(hexString.replace(/^0x/, ''), 'hex')
  }
}
