import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

interface WalletData {
  address: string;
  score: number;
  proof: string[];
}

interface ExternalApiResponse {
  wallets: WalletData[];
  merkleRoot: string;
}

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  async validateWallets(): Promise<{ isApproved: boolean }> {
    try {
      // Fetch data from external API
      const walletData = await this.fetchWalletData();
      
      if (!walletData || !walletData.wallets || walletData.wallets.length !== 3) {
        this.logger.error('Invalid wallet data received from external API');
        throw new HttpException(
          'Invalid wallet data received from external API',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Count how many wallets are valid
      let validWalletCount = 0;

      // Validate each wallet's merkle proof
      for (const wallet of walletData.wallets) {
        try {
          const isValid = this.verifyMerkleProof(
            wallet.proof,
            walletData.merkleRoot,
            wallet.address,
            wallet.score,
          );
          
          if (isValid) {
            validWalletCount++;
          }
          
          this.logger.debug(`Wallet ${wallet.address} validation result: ${isValid}`);
        } catch (error) {
          this.logger.error(`Error validating wallet ${wallet.address}: ${error.message}`);
          // Continue with next wallet even if one fails
          continue;
        }
      }

      // Return true if at least 2 wallets are valid
      return { isApproved: validWalletCount >= 2 };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error in validateWallets: ${error.message}`);
      throw new HttpException(
        'Error validating wallets',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchWalletData(): Promise<ExternalApiResponse> {
    try {
      // Replace with your actual API endpoint
      const response = await axios.get<ExternalApiResponse>('YOUR_API_ENDPOINT');
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching wallet data: ${error.message}`);
      throw new HttpException(
        'Failed to fetch wallet data from external API',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private verifyMerkleProof(
    proof: string[],
    root: string,
    address: string,
    score: number,
  ): boolean {
    try {
      // Verify the merkle proof using StandardMerkleTree.verify
      return StandardMerkleTree.verify(
        root, 
        ['address', 'uint256'], 
        [address, score.toString()], 
        proof
      );
    } catch (error) {
      this.logger.error(`Error verifying merkle proof: ${error.message}`);
      return false;
    }
  }
}
