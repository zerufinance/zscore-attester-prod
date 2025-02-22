import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'
import { ethers } from 'ethers'
const keccak256 = require('keccak256')

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

      console.log({ root })
      console.log(walletProofs)

      for (const wallet of walletProofs) {
        try {
          const leaf = this.hashLeaf(wallet.wallet_address, wallet.score)
          const isValid = this.verifyMerkleProof(leaf, wallet.proof, root)

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

  private verifyMerkleProof(
    leaf: string,
    proof: string[],
    root: string,
    sortPairs: boolean = true
  ): boolean {
    let computedHash = Buffer.from(leaf.replace(/^0x/, ''), 'hex')
    const rootBuffer = Buffer.from(root.replace(/^0x/, ''), 'hex')

    // Iterate over each proof element and hash them together.
    for (const proofElementHex of proof) {
      const proofElement = Buffer.from(
        proofElementHex.replace(/^0x/, ''),
        'hex'
      )

      // If using sorted pairs, sort the two buffers before concatenating.
      if (sortPairs) {
        if (Buffer.compare(computedHash, proofElement) < 0) {
          computedHash = keccak256(Buffer.concat([computedHash, proofElement]))
        } else {
          computedHash = keccak256(Buffer.concat([proofElement, computedHash]))
        }
      } else {
        // Non-sorted: simply concatenate in the provided order.
        computedHash = keccak256(Buffer.concat([computedHash, proofElement]))
      }
    }

    return computedHash.equals(rootBuffer)
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

  private verifyProof(leaf: Buffer, proof: Buffer[], root: Buffer): boolean {
    let computedHash = leaf
    for (const sibling of proof) {
      // Sort the two 32-byte hashes just like Solidity does (lexicographically)
      const combined =
        Buffer.compare(computedHash, sibling) < 0
          ? Buffer.concat([computedHash, sibling])
          : Buffer.concat([sibling, computedHash])
      // Compute the new hash
      const hashHex = ethers.keccak256(combined)
      computedHash = Buffer.from(hashHex.slice(2), 'hex')
    }
    return computedHash.equals(root)
  }

  private hexToBuffer(hexString: string): Buffer {
    return Buffer.from(hexString.replace(/^0x/, ''), 'hex')
  }

  private hashLeaf(walletAddress: string, score: any) {
    return ethers.solidityPackedKeccak256(
      ['address', 'uint256'],
      [walletAddress, score]
    )
  }

  private getSeed(): string {
    return (Math.floor(Math.random() * 10_000_000) + 1).toString()
  }
}
