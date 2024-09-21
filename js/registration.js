let collection_name, nft_id


async function initialize() {
  let collection_obj = extractNFTInfoFromURL(document.location)
  
  if (!collection_obj) {
    nftNotFound()
    return
  }

  collection_name = collection_obj.collection_name.toLowerCase()
  nft_id = collection_obj.nft_id

  if (!collection_name || !nft_id) {
    nftNotFound()
    return
  }
  
  $('#ens-name').text(formatSubdomain(collection_name, nft_id))
  $('#txt-ens-name').val(formatSubdomain(collection_name, nft_id))
  
  await initializeWeb3(constants.testnet)


  // get collection data
  collection_obj = await getCollectionDetails(collection_name, nft_id)

  // check if provided collection supported by eth.me
  if (!collection_obj.status) {
    showError(collection_obj.message)
    return
  }
  let collection_data = collection_obj.data

  // check if subdomain exists
  let subdomain_exists = await checkIfSubdomainExists(collection_name, nft_id)
  if (subdomain_exists) {
    showError("Sub-domain already registered.")
    return
  }

  
  // TODO: check if subdomain already added to queue


  // check if metamask connected
  // wallet not connected
  if (!window.ethereum.selectedAddress) {
    $('#btnConnect').removeClass('d-none')
  }

  // wallet connected
  else {
    updateAccountDetails(window.ethereum.selectedAddress)
    $('#btnRegister').removeClass('d-none')

    // check connected wallet is owner of current nft
    if (!collection_data.owner_address || collection_data.owner_address != window.ethereum.selectedAddress) {
      $('#btnRegister').attr('disabled', 'disabled')
      showError("Only owner of NFT can register.")
      return
    }
  }
}


function nftNotFound(){
  $('#ens-desc').text('NFT information missing')
}


function showError(msg){
  $('#msg').addClass('text-danger')
  $('#msg').text(msg)
}


function showMsg(msg){
  $('#msg').addClass('text-success')
  $('#msg').text(msg)
}


function updateAccountDetails(account){
  let address_obj = formatAddress(account)
  
  $('#ens-addr').attr('href', address_obj.address_link)
  $('#ens-addr').text(address_obj.short_address)
}


async function getCollectionDetails(collection_name, nft_id){
  let response = await fetch(constants.backend_url + 'nftcollections/' + collection_name + '/' + nft_id);
  let json_response = await response.json();
  
  if (response.status == 200) {
    return { status: true, data: json_response.data } 
  }
  else {
    return { status: false, message: json_response.message } 
  }
}


function showLoading(){
  $('#btnRegister').attr('disabled', 'disabled')
  $('#loader').removeClass('d-none')
  showMsg('')
}


function hideLoading(disable_btn = false){
  $('#btnRegister').attr('disabled', disable_btn)
  $('#loader').addClass('d-none')
}


async function getMsgToSign(owner_address) {
  let response = await fetch(constants.backend_url + 'getMsgToSign/' + owner_address);
  if (response.status != 200) return false

  let json_response = await response.json();
  return json_response.data.msgToSign
}


async function signMsg(msg, address) {
  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [msg, address],
    });
    return signature
  } 
  catch (error) {
    console.error('Error:', error.message);
    return false
  }
}


/* 
* EVENTS
*/

/**
 * Event
 * To catch when metamask account is changed. 
 * Update account where needed.
 */
window.ethereum.on('accountsChanged', function (accounts) {
  updateAccountDetails(accounts[0])
  console.log(accounts[0]); //-- current selected account
});


async function btnConnectWallet(){
  if(await connectWallet()){
    $('#btnConnect').addClass('d-none')
    $('#btnRegister').removeClass('d-none')

    updateAccountDetails(window.ethereum.selectedAddress)
  }
}


/**
 * Adds subname registration request to queue for bulk registration. 
 */
async function btnAddSubdomainToQueue(){
  try {
    showLoading()

    if(!window.ethereum.selectedAddress){
      throw("Please connect wallet.")
    }

    if(!collection_name || !nft_id){
      throw("Collection name or nft id missing.")
    }

    const msg_to_sign =  await getMsgToSign(window.ethereum.selectedAddress)
    if(!msg_to_sign){
      throw("Unable to fetch message to sign, please try again later.")
    }

    // Request the user to sign the message
    const signed_msg = await signMsg(msg_to_sign, window.ethereum.selectedAddress)
    console.log(signed_msg);

    if(!signed_msg){
      throw("Unable to fetch message to sign, please try again later.")
    }

    // send req to backend to add name to queue
    let params = {
      signed_msg: signed_msg,
      collection_name: collection_name,
      nft_id: nft_id,
      connected_address: window.ethereum.selectedAddress
    }

    let response = await makePOSTRequest(constants.backend_url + 'registerdomain', params)
    let json_response = await response.json();
    console.log(json_response);

    if (response.status == 200) {
      showMsg('Registration added to queue successfully.')
    }
    else {
      showError(json_response.message)
    }

    hideLoading(true)
  }
  catch (error) {
    console.log(error);
    showError(error)
    hideLoading()
  }
}

