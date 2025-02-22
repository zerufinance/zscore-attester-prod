import { Test, TestingModule } from "@nestjs/testing";
import { ValidatorService } from "./validator.service";
import axios from "axios";
import { HttpException, HttpStatus } from "@nestjs/common";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Mock axios and StandardMerkleTree
jest.mock("axios");
jest.mock("@openzeppelin/merkle-tree");

describe("ValidatorService", () => {
  let service: ValidatorService;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidatorService],
    }).compile();

    // Get the service instance
    service = module.get<ValidatorService>(ValidatorService);

    // Cast axios to a mock
    mockAxios = axios as jest.Mocked<typeof axios>;
  });

  // Test successful wallet validation
  describe("validateWallets - Success Scenarios", () => {
    it("should return isApproved true when 2 or more wallets are valid", async () => {
      // Mock successful API response
      const mockApiResponse = {
        wallets: [
          {
            address: "0x1111111111111111111111111111111111111111",
            score: 100,
            proof: ["proof1"],
          },
          {
            address: "0x2222222222222222222222222222222222222222",
            score: 200,
            proof: ["proof2"],
          },
          {
            address: "0x3333333333333333333333333333333333333333",
            score: 300,
            proof: ["proof3"],
          },
        ],
        merkleRoot: "0xabcdef",
      };

      // Mock axios get method
      mockAxios.get.mockResolvedValue({ data: mockApiResponse });

      // Mock StandardMerkleTree.verify to return true for first two wallets
      (StandardMerkleTree.verify as jest.Mock)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Call the method
      const result = await service.validateWallets("0xabcdef");

      // Assertions
      expect(result.data).toBe(true);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(StandardMerkleTree.verify).toHaveBeenCalledTimes(3);
    });
  });

  // Test failure scenarios
  describe("validateWallets - Failure Scenarios", () => {
    it("should throw HttpException for invalid wallet data", async () => {
      // Mock API response with incorrect number of wallets
      const mockApiResponse = {
        wallets: [
          {
            address: "0x1111111111111111111111111111111111111111",
            score: 100,
            proof: ["proof1"],
          },
        ],
        merkleRoot: "0xabcdef",
      };

      // Mock axios get method
      mockAxios.get.mockResolvedValue({ data: mockApiResponse });

      // Expect an HttpException to be thrown
      await expect(service.validateWallets("0xabcdef")).rejects.toThrow(
        HttpException
      );
      await expect(service.validateWallets("0xabcdef")).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid wallet data received from external API",
      });
    });

    it("should return isApproved false when fewer than 2 wallets are valid", async () => {
      // Mock successful API response
      const mockApiResponse = {
        wallets: [
          {
            address: "0x1111111111111111111111111111111111111111",
            score: 100,
            proof: ["proof1"],
          },
          {
            address: "0x2222222222222222222222222222222222222222",
            score: 200,
            proof: ["proof2"],
          },
          {
            address: "0x3333333333333333333333333333333333333333",
            score: 300,
            proof: ["proof3"],
          },
        ],
        merkleRoot: "0xabcdef",
      };

      // Mock axios get method
      mockAxios.get.mockResolvedValue({ data: mockApiResponse });

      // Mock StandardMerkleTree.verify to return false for all wallets
      (StandardMerkleTree.verify as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      // Call the method
      const result = await service.validateWallets("0xabcdef");

      // Assertions
      expect(result.data).toBe(false);
    });

    it("should handle API fetch errors", async () => {
      // Mock axios to throw an error
      mockAxios.get.mockRejectedValue(new Error("Network Error"));

      // Expect an HttpException to be thrown
      await expect(service.validateWallets("0xabcdef")).rejects.toThrow(
        HttpException
      );
      await expect(service.validateWallets("0xabcdef")).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
        message: "Failed to fetch wallet data from external API",
      });
    });
  });

  // Test merkle proof verification
  describe("verifyMerkleProof", () => {
    it("should verify merkle proof correctly", () => {
      // Use reflection to test the private method
      const verifyMethod = (service as any).verifyMerkleProof;

      // Mock StandardMerkleTree.verify
      (StandardMerkleTree.verify as jest.Mock).mockReturnValue(true);

      const result = verifyMethod(
        ["proof"],
        "0xroot",
        "0x1111111111111111111111111111111111111111",
        100
      );

      // Assertions
      expect(result).toBe(true);
      expect(StandardMerkleTree.verify).toHaveBeenCalledWith(
        "0xroot",
        ["address", "uint256"],
        ["0x1111111111111111111111111111111111111111", "100"],
        ["proof"]
      );
    });

    it("should handle verification errors gracefully", () => {
      // Use reflection to test the private method
      const verifyMethod = (service as any).verifyMerkleProof.bind(service);

      // Mock StandardMerkleTree.verify to throw an error
      (StandardMerkleTree.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Verification failed");
      });

      const result = verifyMethod(
        ["proof"],
        "0xroot",
        "0x1111111111111111111111111111111111111111",
        100
      );

      // Assertions
      expect(result).toBe(false);
    });
  });
});
