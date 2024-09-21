// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface ENS {
    // Logged when the owner of a node assigns a new owner to a subnode.
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address owner);

    // Logged when the owner of a node transfers ownership to a new account.
    event Transfer(bytes32 indexed node, address owner);

    // Logged when the resolver for a node changes.
    event NewResolver(bytes32 indexed node, address resolver);

    // Logged when the TTL of a node changes
    event NewTTL(bytes32 indexed node, uint64 ttl);

    // Logged when an operator is added or removed.
    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    function setRecord(
        bytes32 node,
        address owner,
        address resolver,
        uint64 ttl
    ) external;

    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner,
        address resolver,
        uint64 ttl
    ) external;

    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner
    ) external returns (bytes32);

    function setResolver(bytes32 node, address resolver) external;

    function setOwner(bytes32 node, address owner) external;

    function setTTL(bytes32 node, uint64 ttl) external;

    function setApprovalForAll(address operator, bool approved) external;

    function owner(bytes32 node) external view returns (address);

    function resolver(bytes32 node) external view returns (address);

    function ttl(bytes32 node) external view returns (uint64);

    function recordExists(bytes32 node) external view returns (bool);

    function isApprovedForAll(
        address owner,
        address operator
    ) external view returns (bool);
}


interface Resolver {
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;

    function multicall(
        bytes[] calldata data
    ) external returns (bytes[] memory results);
}


interface ERC721{
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the caller.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool _approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}


library SafeMath {
    
    function parseInt(string memory _value) internal pure returns (uint256) {
        bytes memory b = bytes(_value);
        uint256 result = 0;

        for (uint256 i = 0; i < b.length; i++) {
            if (uint8(b[i]) >= 48 && uint8(b[i]) <= 57) {
                result = result * 10 + (uint256(uint8(b[i])) - 48);
            }
        }
        return result;
    }
}


/**
 * The Ownable contract has an owner address, and provides basic authorization control 
 * functions.
 */
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

}


/**
 * Defines operations related to Bulk ENS registration.
 */
contract BulkENS is Ownable {
    using SafeMath for string;

    ENS public registry; // ENS registry address
    Resolver public resolver; // Custom resolver address
    string rootDomain = "eth";
    string public mainDomain = "you";
    address zeroAddress = 0x0000000000000000000000000000000000000000;

    mapping(string => address) public supportedCollections;
    
    
    constructor(ENS _registry){
        registry =  _registry;
    }


    /**
     * @dev Takes array of subdomains with owner addresses and create bulk subdomains interacting
     * with ENS registry contract.
     * 
     * @param node - parent name hash - parentname.eth
     * @param subNodeHashes - keccak hash of just subnames - keccak256(abi.encodePacked(subName));
     * @param addresses - respective owner addresses 
     */
    function createBulkSubdomains(
        bytes32 node,
        bytes32[] calldata subNodeHashes,
        address[] calldata addresses
    )
    external onlyOwner
    {
        require(subNodeHashes.length == addresses.length, "Provided names and addresses should be equal.");
        
        for (uint256 i = 0; i < subNodeHashes.length; i++) {
            // call ENS registry
    		registry.setSubnodeRecord(node, subNodeHashes[i], addresses[i], address(resolver), 0);
        }
    }


    /**
     * @dev Creates single subname for provided node. Called by user (NFT owner).
     * 
     * @param node - parent name hash - parentname.eth
     * @param symbol - collection symbol as defined in supportedCollections mapping
     * @param nftId - NFT ID that owner wants to create subname of.
     */
    function createSubdomain(
        bytes32 node,
        string calldata symbol,
        string calldata nftId
    )
    external
    {
        address collectionAddress = supportedCollections[symbol];
        require(collectionAddress != zeroAddress, "Collection not supported.");

        ERC721 nftContract = ERC721(collectionAddress);
        require(msg.sender == nftContract.ownerOf(nftId.parseInt()), "You must own this nft in order to create sub-domain.");

        bytes32 subNodeHash = getSubnodeHash(symbol, nftId);

        registry.setSubnodeRecord(node, subNodeHash, msg.sender, address(resolver), 0);
    }


    function setResolver(Resolver _resolver) external onlyOwner {
        resolver = _resolver;
    }


    /**
     * @dev Takes array of symbols and contract addresses and add to supported collections.
     * 
     * @param symbols - collection symbols to add.
     * @param collectionAddresses - contract address for provided collection symbols.
     */
     function addSupportedCollection(
        string[] calldata symbols,
        address[] calldata collectionAddresses
    )
    external onlyOwner
    {
        for (uint256 i = 0; i < symbols.length; i++) {
            supportedCollections[symbols[i]] = collectionAddresses[i];
        }
    }
    
    
    /**
     * @dev Format provided sybmol and nftid to create subname according to Eth.Me standard.
     * returns keccak hash for subname.
     */
    function getSubnodeHash(
        string calldata symbol, 
        string calldata nftId
    ) 
    private 
    pure 
    returns(bytes32) 
    {
        string memory subNode = string.concat(symbol, '-', nftId);
        return keccak256(abi.encodePacked(subNode));
    }
}
