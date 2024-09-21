
async function initialize() {
  let { collection_name, nft_id } = extractNFTInfoFromURL(document.location)

  if (!collection_name || !nft_id) {
    nftNotFound()
    return
  }
  else {
    $('#ens-name').text(formatSubdomain(collection_name, nft_id))
  }

  await initializeWeb3(constants.testnet)

  
  // [TO-DO] check if provided collection supported by eth.me

  
  // check if subdomain exists
  let subdomain_exists = await checkIfSubdomainExists(collection_name, nft_id)

  // if subname doesnt exist, show claim button & basic nft info
  if (!subdomain_exists) {
    showClaimBtn(collection_name, nft_id)
    // showBasicInfo()
  }
  // else if subdomain exists show basic info and nft ens records, or maybe redirect to home (subname) page bayc-0001.eth.me
  else {
  }
}


function nftNotFound(){
  $('#ens-desc').text('NFT information missing')
}


function showClaimBtn(collection_name, nft_id){
  let reg_link = $('#btnClaim').attr('href')
  reg_link += '?q=' + collection_name + '-' + nft_id

  $('#btnClaim').attr('href', reg_link)
  $('#btnClaim').removeClass('d-none')
}
