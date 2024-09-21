const ens_name = getENSFromURL(location.hostname)
var url_path = getPathFromURL(location)
console.time('home');

/**
 * Initialize details for blockchain interaction, like web3 instance and contracts. 
 */
async function initialize() {
  document.title = ens_name + constants.web2_domain_tld;
  let redirect_url;

  try {
    const ens_name_hash = namehash(ens_name)
    let ens_data = await getENSDataFromGraph(ens_name_hash)
    
    // if no data found it means name not exists or resolver not set
    if (!ens_data || !ens_data.resolver) {
      window.location.replace(constants.ens_app_url + ens_name)
      return
    }

    ens_data = ens_data.resolver
    let ar_texts = ens_data.texts
    let resolver_address = ens_data.address
    let encoded_content_hash = ens_data.contentHash
    
    
    let content_hash = decodeContentHashWithLink(encoded_content_hash)
    console.log('content_hash', content_hash);
    
    redirect_url = content_hash + url_path
    window.location.replace(redirect_url)
  } 
  catch (error) {
    console.log('error in initialize()');      
    console.log(error);    
  }

}
