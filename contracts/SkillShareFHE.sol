// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract SkillShareFHE is SepoliaConfig {
    struct EncryptedSkill {
        uint256 id;
        euint32 encryptedSkillName;    // Encrypted skill name
        euint32 encryptedDescription;  // Encrypted skill description
        euint32 encryptedCategory;     // Encrypted category or tag
        uint256 timestamp;
    }

    struct EncryptedRequest {
        uint256 id;
        euint32 encryptedSkillName;    // Encrypted requested skill
        euint32 encryptedPreferences;  // Encrypted learning preferences
        uint256 timestamp;
    }

    struct DecryptedSkill {
        string skillName;
        string description;
        string category;
        bool isRevealed;
    }

    struct DecryptedRequest {
        string skillName;
        string preferences;
        bool isRevealed;
    }

    uint256 public skillCount;
    uint256 public requestCount;

    mapping(uint256 => EncryptedSkill) public encryptedSkills;
    mapping(uint256 => DecryptedSkill) public decryptedSkills;

    mapping(uint256 => EncryptedRequest) public encryptedRequests;
    mapping(uint256 => DecryptedRequest) public decryptedRequests;

    mapping(string => euint32) private encryptedCategoryCount;
    string[] private categoryList;

    mapping(uint256 => uint256) private requestToSkillOrRequestId;

    event SkillSubmitted(uint256 indexed id, uint256 timestamp);
    event RequestSubmitted(uint256 indexed id, uint256 timestamp);
    event DecryptionRequested(uint256 indexed id);
    event SkillDecrypted(uint256 indexed id);
    event RequestDecrypted(uint256 indexed id);

    modifier onlyParticipant(uint256 itemId) {
        // Placeholder for access control
        _;
    }

    function submitEncryptedSkill(
        euint32 encryptedSkillName,
        euint32 encryptedDescription,
        euint32 encryptedCategory
    ) public {
        skillCount += 1;
        uint256 newId = skillCount;

        encryptedSkills[newId] = EncryptedSkill({
            id: newId,
            encryptedSkillName: encryptedSkillName,
            encryptedDescription: encryptedDescription,
            encryptedCategory: encryptedCategory,
            timestamp: block.timestamp
        });

        decryptedSkills[newId] = DecryptedSkill({
            skillName: "",
            description: "",
            category: "",
            isRevealed: false
        });

        emit SkillSubmitted(newId, block.timestamp);
    }

    function submitEncryptedRequest(
        euint32 encryptedSkillName,
        euint32 encryptedPreferences
    ) public {
        requestCount += 1;
        uint256 newId = requestCount;

        encryptedRequests[newId] = EncryptedRequest({
            id: newId,
            encryptedSkillName: encryptedSkillName,
            encryptedPreferences: encryptedPreferences,
            timestamp: block.timestamp
        });

        decryptedRequests[newId] = DecryptedRequest({
            skillName: "",
            preferences: "",
            isRevealed: false
        });

        emit RequestSubmitted(newId, block.timestamp);
    }

    function requestSkillDecryption(uint256 skillId) public onlyParticipant(skillId) {
        EncryptedSkill storage skill = encryptedSkills[skillId];
        require(!decryptedSkills[skillId].isRevealed, "Already decrypted");

        bytes32 ;
        ciphertexts[0] = FHE.toBytes32(skill.encryptedSkillName);
        ciphertexts[1] = FHE.toBytes32(skill.encryptedDescription);
        ciphertexts[2] = FHE.toBytes32(skill.encryptedCategory);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptSkill.selector);
        requestToSkillOrRequestId[reqId] = skillId;

        emit DecryptionRequested(skillId);
    }

    function requestLearningDecryption(uint256 requestId) public onlyParticipant(requestId) {
        EncryptedRequest storage req = encryptedRequests[requestId];
        require(!decryptedRequests[requestId].isRevealed, "Already decrypted");

        bytes32 ;
        ciphertexts[0] = FHE.toBytes32(req.encryptedSkillName);
        ciphertexts[1] = FHE.toBytes32(req.encryptedPreferences);

        uint256 reqFHEId = FHE.requestDecryption(ciphertexts, this.decryptRequest.selector);
        requestToSkillOrRequestId[reqFHEId] = requestId;

        emit DecryptionRequested(requestId);
    }

    function decryptSkill(uint256 requestId, bytes memory cleartexts, bytes memory proof) public {
        uint256 skillId = requestToSkillOrRequestId[requestId];
        require(skillId != 0, "Invalid request");

        DecryptedSkill storage dSkill = decryptedSkills[skillId];
        require(!dSkill.isRevealed, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));

        dSkill.skillName = results[0];
        dSkill.description = results[1];
        dSkill.category = results[2];
        dSkill.isRevealed = true;

        if (!FHE.isInitialized(encryptedCategoryCount[dSkill.category])) {
            encryptedCategoryCount[dSkill.category] = FHE.asEuint32(0);
            categoryList.push(dSkill.category);
        }

        encryptedCategoryCount[dSkill.category] = FHE.add(
            encryptedCategoryCount[dSkill.category],
            FHE.asEuint32(1)
        );

        emit SkillDecrypted(skillId);
    }

    function decryptRequest(uint256 requestId, bytes memory cleartexts, bytes memory proof) public {
        uint256 learningId = requestToSkillOrRequestId[requestId];
        require(learningId != 0, "Invalid request");

        DecryptedRequest storage dReq = decryptedRequests[learningId];
        require(!dReq.isRevealed, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));
        dReq.skillName = results[0];
        dReq.preferences = results[1];
        dReq.isRevealed = true;

        emit RequestDecrypted(learningId);
    }

    function getDecryptedSkill(uint256 skillId) public view returns (string memory skillName, string memory description, string memory category, bool isRevealed) {
        DecryptedSkill storage s = decryptedSkills[skillId];
        return (s.skillName, s.description, s.category, s.isRevealed);
    }

    function getDecryptedRequest(uint256 requestId) public view returns (string memory skillName, string memory preferences, bool isRevealed) {
        DecryptedRequest storage r = decryptedRequests[requestId];
        return (r.skillName, r.preferences, r.isRevealed);
    }

    function getEncryptedCategoryCount(string memory category) public view returns (euint32) {
        return encryptedCategoryCount[category];
    }

    function requestCategoryCountDecryption(string memory category) public {
        euint32 count = encryptedCategoryCount[category];
        require(FHE.isInitialized(count), "Category not found");

        bytes32 ;
        ciphertexts[0] = FHE.toBytes32(count);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptCategoryCount.selector);
        requestToSkillOrRequestId[reqId] = bytes32ToUint(keccak256(abi.encodePacked(category)));
    }

    function decryptCategoryCount(uint256 requestId, bytes memory cleartexts, bytes memory proof) public {
        uint256 categoryHash = requestToSkillOrRequestId[requestId];
        string memory category = getCategoryFromHash(categoryHash);

        FHE.checkSignatures(requestId, cleartexts, proof);

        uint32 count = abi.decode(cleartexts, (uint32));
        // Handle decrypted count as needed
    }

    function bytes32ToUint(bytes32 b) private pure returns (uint256) {
        return uint256(b);
    }

    function getCategoryFromHash(uint256 hash) private view returns (string memory) {
        for (uint i = 0; i < categoryList.length; i++) {
            if (bytes32ToUint(keccak256(abi.encodePacked(categoryList[i]))) == hash) {
                return categoryList[i];
            }
        }
        revert("Category not found");
    }
}
