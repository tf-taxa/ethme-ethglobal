/*
* CONFIG
*/
const is_localhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const infura_key = '69239fa82795403c85acad5ef889505c' // whitelist origins added to infura key
const alchemy_key = 'yOKZQOEt5sXUTVm_WOR56-21h0itKD9n' // whitelist origins
const graph_key = '7c95a8f89dfd52c1e6bcafadd4426468' // whitelist origins
const ens_subgraph_id = '5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH'

const constants = {
  backend_url: !is_localhost ? 'https://eth.me/api/' : 'http://localhost:1337/api/',
  top_domain: 'you2.eth', //you2 on sepolia
  web2_domain_tld: '.me',
  zero_address: '0x0000000000000000000000000000000000000000',
 
  graph_url: `https://gateway-arbitrum.network.thegraph.com/api/${graph_key}/subgraphs/id/${ens_subgraph_id}`,
  alchemy_url: 'https://eth-mainnet.g.alchemy.com/v2/' + alchemy_key,
  infura_url: 'https://mainnet.infura.io/v3/' + infura_key,
  infura_url_testnet: 'https://sepolia.infura.io/v3/' + infura_key, 
  testnet: 'testnet',

  ipfs_gateway: 'https://www.eth2.me/',
  bzz_gateway: 'https://gateway.ethswarm.org/',
  sia_gateway: 'https://siasky.net/',
  arweave_gateway: 'https://arweave.net/',
  ens_app_url: 'https://app.ens.domains/',

  version: '0.0.1',

  erc721ABI: [
    {
      "constant": true,
      "inputs": [
        {
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "type": "function"
    },
  ],

  erc1155ABI: [
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ],
}
/*
* CONFIG END
*/


var g_resolver, g_network_id

getAppVersion()


/*
 * Gets content hash field for provided ENS name and returns encoded hash value.
 */
async function getContentHashFromContract(_ensName) {
  try {
    const resolver_address = await getResolverAddressForENSName(_ensName)
    if (!resolver_address || resolver_address == constants.zero_address) return false

    const resolverContract = new web3.eth.Contract(constants.resolverABI, resolver_address);

    const ens_name_hash = namehash(_ensName)
    let encoded_content_hash = await resolverContract.methods.contenthash(ens_name_hash).call();
    return encoded_content_hash
  }
  catch (error) {
    console.log(error);
    return false
  }
}


/*
 * Decodes provided encoded content hash and returns decoded hash with protocol type.
 */
function decodeContentHash(encoded_content_hash) {
  try {
    let decoded_content_hash = contentHash.decode(encoded_content_hash)
    const codec = contentHash.getCodec(encoded_content_hash)
    let protocolType

    if (codec === 'ipfs-ns') {
      protocolType = 'ipfs'
    } else if (codec === 'ipns-ns') {
      protocolType = 'ipns'
    } else if (codec === 'swarm-ns') {
      protocolType = 'bzz'
    } else if (codec === 'onion') {
      protocolType = 'onion'
    } else if (codec === 'onion3') {
      protocolType = 'onion3'
    } else if (codec === 'skynet-ns') {
      protocolType = 'sia'
    } else if (codec === 'arweave-ns') {
      protocolType = 'arweave'
    } else {
      decoded = encoded
    }

    return { protocolType, decoded: decoded_content_hash }
  }
  catch (error) {
    console.log(error);
    return false
  }
}


/*
 * Generates web2 content hash link w.r.t. provided protocol.
 */
function getContentHashLink(objContentHash) {
  try {
    const protocol = objContentHash.protocolType
    const hash = objContentHash.decoded

    if (protocol === 'ipfs') {
      return `${constants.ipfs_gateway}ipfs/${hash}`
    }
    if (protocol === 'ipns') {
      return `${constants.ipfs_gateway}ipns/${hash}`
    }
    if (protocol === 'bzz') {
      return `${constants.bzz_gateway}bzz/${hash}`
    }
    if (protocol === 'onion' || protocol === 'onion3') {
      return `http://${hash}.onion`
    }
    if (protocol === 'sia') {
      return `${constants.sia_gateway}/${hash}`
    }
    if (protocol === 'arweave' || protocol === 'ar') {
      return `${constants.arweave_gateway}/${hash}`
    }
    return false
  }
  catch (error) {
    console.log(error);
    return false
  }
}


/*
 * Gets content hash field for provided ENS name and returns hash wit respective protocol.
 */
async function getContentHashForENSName(_ensName) {
  try {
    let encoded_content_hash = await getContentHashFromContract(_ensName)
    if(!encoded_content_hash || encoded_content_hash == '') return false

    let objContentHash = decodeContentHash(encoded_content_hash)

    if(!objContentHash.decoded || objContentHash.decoded == '0x0000000000000000000000000000000000000000') return false
    
    let content = getContentHashLink(objContentHash)
    return content
  }
  catch (error) {
    console.log(error);
    return false
  }
}


/*
 * Decodes provided encoded content hash and returns hash with respective protocol.
 */
function decodeContentHashWithLink(encoded_content_hash) {
  let objContentHash = decodeContentHash(encoded_content_hash)

  if(!objContentHash.decoded || objContentHash.decoded == '0x0000000000000000000000000000000000000000') return false

  let content = getContentHashLink(objContentHash)
  return content
}

/*
 * Get ENS data from Graph Indexer for given ENS name.
 */
async function getENSDataFromGraph(ens_name_hash){
  try {
    let query = `query getSubgraphRecords($id: String!) {
        domain(id: $id) {
          name
          resolver {
            address
            contentHash
            texts
          }
        }
      }
    `
    let params = {
      "query": query,
      "variables":{ "id": ens_name_hash },
      "operationName": "getSubgraphRecords"
    }

    let response = await makePOSTRequest(constants.graph_url, params)
    let ensname_data = await response.json()
    ensname_data = ensname_data.data.domain
    
    console.log(ensname_data);
    return ensname_data
  }
  catch (error) {
    console.log(error);
    return false
  }
}


/*
 * Gets index field from text records of the passed ENS name.
 * Also chekcs if the field is supported, and converts it in redirect URL.
 * Index field is a custom field defined for eth.me redirection page.
 * 
 * Returns redirect URL on success. In case if field not supported or any 
 * issue found then returns blank string ''.
 */
async function getIndexRecordForENSName(ens_name_hash, resolver_address, encoded_content_hash) {
  try {
    let supported_fields = ['url', 'contenthash', 'com.twitter', 'com.github', 'com.telegram', 'com.linkedin', 'com.opensea', 'com.reddit', 'com.etherscan']

    // get resolver for ENS name
    if (!resolver_address || resolver_address == constants.zero_address) return false
    
    // use contract interaction for text fields, bcz web3.js library doesnt contain method for it, and ethers doesnt support ipns url
    const resolverContract = new web3.eth.Contract(constants.resolverABI, resolver_address);

    // get index text field
    let index_field = await resolverContract.methods.text(ens_name_hash, 'index').call();
    console.log('index_field', index_field);


    // check if field supported, and generate url
    if (supported_fields.includes(index_field)) {
      let index_url = ''

      // if contenthash then get and generate ipfs url
      if (index_field == 'contenthash') {
        index_url = decodeContentHashWithLink(encoded_content_hash) //await getContentHashForENSName(ens_name)
      }

      // if text fields then get value and generate respective URL (like twitter etc)
      else {
        let txt_value = await resolverContract.methods.text(ens_name_hash, index_field).call();
        
        if (index_field == 'url') {
          index_url = ensureHttpProtocol(txt_value)
        }
        else {
          // generate social media URLs with username etc
          index_url = generateIndexValueURL(index_field, txt_value)
        }
      }

      return index_url
    }

    return ''
  } 
  catch (error) {
    console.log(error);  
    return ''
  }
}


/*
 * Gets URL field from text records of the passed ENS name.
 * 
 * Returns redirect URL on success, otherwise returns false.
 */
async function getURLRecordForENSName(ens_name_hash, resolver_address) {
  try {
    // get resolver for ENS name
    if (!resolver_address || resolver_address == constants.zero_address) return false
    
    // use contract interaction for text fields, bcz web3.js library doesnt contain method for it, and ethers doesnt support ipns url
    const resolverContract = new web3.eth.Contract(constants.resolverABI, resolver_address);

    // get index text field
    let url_field = await resolverContract.methods.text(ens_name_hash, 'url').call();
    console.log('url_field', url_field);

    if (url_field && url_field != '') {
      url_field = ensureHttpProtocol(url_field)
      return url_field
    }

    return false
  } 
  catch (error) {
    console.log(error);  
    return false
  }
}


/*
* Gets basic text records for provided ENS name.
*/
async function getTextRecordsForENSName(_ensName) {
  try {
    // get resolver for ENS name
    const resolver_address = await getResolverAddressForENSName(ens_name)
    if (!resolver_address || resolver_address == constants.zero_address) return false

    // use contract interaction for text fields, bcz web3.js library doesnt contain method for it, and ethers doesnt support ipns url
    const resolverContract = new web3.eth.Contract(constants.resolverABI, resolver_address);
    const ens_name_hash = namehash(_ensName)

    let text_records = {
      description: '',
      avatar: '',
      twitter: '',
      github: '',
      telegram: '',
    }
    
    text_records.description = await resolverContract.methods.text(ens_name_hash, 'description').call();
    text_records.avatar = await resolverContract.methods.text(ens_name_hash, 'avatar').call();
    text_records.twitter = await resolverContract.methods.text(ens_name_hash, 'com.twitter').call();
    text_records.github = await resolverContract.methods.text(ens_name_hash, 'com.github').call();
    text_records.telegram = await resolverContract.methods.text(ens_name_hash, 'org.telegram').call();

    console.log(text_records);
    return text_records
  } 
  catch (error) {
    console.log(error);  
    return false
  }
}


function generateIndexValueURL(index_field, txt_value) {
  switch (index_field) {
    case 'com.twitter':
      return generateTwitterURL(txt_value)

    case 'com.github':
      return generateGithubURL(txt_value)

    case 'com.telegram':
      return generateTelegramURL(txt_value)

    case 'com.linkedin':
      return generateLinkedinURL(txt_value)

    case 'com.opensea':
      return generateOpenseaURL(txt_value)

    case 'com.reddit':
      return generateRedditURL(txt_value)

    case 'com.etherscan':
      return generateEtherscanURL(txt_value)

    default:
      return '';
  }
}


/**
* ENS avatar field also supports adding images directly from NFT contract.
* This function fetches metadata from given NFT contract & extracts image.
*/
async function fetchImgFromNFT(token_standard, token_contract, token_id) {
  let token_uri

  // call ERC721 contract with respective ABI
  if (token_standard == 'erc721') {
    const erc721Contract = new web3.eth.Contract(constants.erc721ABI, token_contract);
    token_uri = await erc721Contract.methods.tokenURI(token_id).call();
  }

  // call ERC1155 contract with respective ABI
  else if (token_standard == 'erc1155') {
    const erc1155Contract = new web3.eth.Contract(constants.erc1155ABI, token_contract);
    token_uri = await erc1155Contract.methods.uri(token_id).call();
  }
  console.log(token_uri);

  token_uri = token_uri.startsWith('ipfs://') ? resolveIPFSURL(token_uri) : token_uri

  const response = await fetch(token_uri);
  const metadata = await response.json();
  let nft_img = metadata.image
  console.log(metadata);

  nft_img = nft_img.startsWith('ipfs://') ? resolveIPFSURL(nft_img) : nft_img
  return nft_img
}


/**
* Resolves IPFS url to HTTPS url. 
*/
function resolveIPFSURL(ipfs_url) {
  return constants.ipfs_gateway + 'ipfs/' + ipfs_url.replace('ipfs://','')
}


/**
* Get address of provided ENS name.
* Returns { full address, short_address, address_link }. 
*/
async function getAddress(ens_name) {
  let address = await web3.eth.ens.getAddress(ens_name)
  return formatAddress(address)
}


/**
* Formats provided address and also add short address and block scanner link.
*/
function formatAddress(address) {
  let address_text = address.substring(0, 6) + '...' +  address.substring(address.length-4, address.length)

  return {
    address: address,
    short_address: address_text,
    address_link: 'https://etherscan.io/address/' + address
  }
}


/**
* Normalise and hash ENS name 
* https://docs.ens.domains/contract-api-reference/name-processing
*/
function namehash(_ensName) {
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  if(typeof(web3) == 'undefined' || typeof(web3.utils) == 'undefined' || !web3.utils) {
    web3 = new Web3() 
  }

  if (_ensName !== '') {
    const labels = _ensName.split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
      const labelSha3 = web3.utils.sha3(labels[i]);
      node = web3.utils.sha3(node + labelSha3.slice(2), { encoding: 'hex' });
    }
  }

  return node;
}


/**
* Extract ens name from URL hostname.
*/
function getENSFromURL(hostname) {
  return hostname.split('.')[0] + '.eth';
}


/**
* Extract path from URL.
*/
function getPathFromURL(location) {
  let url = (new URL(location));
  const path_without_domain = url.pathname + url.hash + url.search;
  return path_without_domain
}


/**
* Initialize web3 object, if metamask is present then connect to window.ethereum 
* else connect to infura.
* param network - will connect to mainnet by default if not found, otherwise if testnet then connect to testnet 
* param is_infura - if true it will connect to infura even if metamask/provider found
*/
async function initializeWeb3(network, is_infura) {
  try {
    if (window.ethereum && !is_infura) {
      web3 = new Web3(window.ethereum)
      console.log('connected to window.ethereum', window.ethereum.isConnected());

      if(!window.ethereum.isConnected())
        await initializeWeb3(false, true) // connect to provider
    }
    else {
      const provider_url = (network && network == constants.testnet) ? constants.infura_url_testnet : constants.alchemy_url
      web3 = new Web3(provider_url)
      console.log('connected to provider', provider_url);
    }
    
    await setRegistryAddress()
  } 
  catch (error) {
    console.log(error);
    return false
  }
}


/**
* Extract NFT info from URL, including Collection and NFT ID.
* else connect to infura.
*/
function extractNFTInfoFromURL(location){
  let params = (new URL(location)).searchParams;
  let nft_data = params.get("q");

  if(!nft_data) return false

  let ar = nft_data.split('-')

  if (ar[0] && ar[1])
    return { collection_name: ar[0], nft_id: ar[1] } 
  else 
    return false
}



/**
* Sets ENS Registry address according to the selected network
*/
async function setRegistryAddress() {
  const network_id = await getNetworkId()
  
  if (!constants.addresses[network_id]) {
    console.log(`Selected network ${network_id} not supported`);
    return
  }

  web3.eth.ens.registryAddress = constants.addresses[network_id].ensRegistryAddress
}


function getRegistryAddress() {
  return web3.eth.ens.registryAddress // web3 registry address is set by our config in initializeWeb3
}


async function getNetworkId() {
  if (g_network_id) return g_network_id // return g_network_id (global variable) if already set (fetched in this cycle)

  const network_id = await web3.eth.net.getId()
  return network_id
}


/* 
 * Gets resolver address for ENS name
 */
async function getResolverAddressForENSName(ens_name) {
  if (g_resolver) return g_resolver // return resolver (global variable) if already set (fetched in this cycle)

  let obj_resolver = await web3.eth.ens.getResolver(ens_name);
  g_resolver = obj_resolver.options.address
  console.log(g_resolver);
  return g_resolver
}


async function makePOSTRequest(url, params_obj) {
  let response = await fetch(url, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params_obj)
  });
  
  return response
}


function generateTwitterURL(value) {
  return 'https://twitter.com/' + value;
}

function generateGithubURL(value) {
  return 'https://github.com/' + value;
}

function generateTelegramURL(value) {
  return 'https://t.me/' + value;
}

function generateLinkedinURL(value) {
  return 'https://linkedin.com/in/' + value;
}

function generateOpenseaURL(value) {
  // user can use profile name like, "XED_Arts" (for https://opensea.io/XED_Arts)
  // or collection link like, "collection/mutant-ape-yacht-club" (for https://opensea.io/collection/mutant-ape-yacht-club)
  return 'https://opensea.io/' + value;
}

function generateRedditURL(value) {
  return 'https://www.reddit.com/user/' + value;
}

function generateEtherscanURL(value) {
  return 'https://etherscan.io/address/' + value;
}

/* 
 * Checks if url has http protocol added, if not then add it
 */
function ensureHttpProtocol(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'http://' + url;
  }

  return url;
}


function getAppVersion() {
  console.log(`Version: ${constants.version}`);
}