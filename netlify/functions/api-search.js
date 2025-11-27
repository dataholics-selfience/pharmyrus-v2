// Netlify Function - API Proxy with CORS Fix
// Proxies requests to the Pharmyrus API to avoid CORS issues

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get molecule name from query parameters
    const moleculeName = event.queryStringParameters?.molecule_name;

    if (!moleculeName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameter: molecule_name'
        })
      };
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Netlify Proxy] Searching for: ${moleculeName}`);
    console.log(`[Netlify Proxy] Timestamp: ${new Date().toISOString()}`);

    // Call the HTTPS API (NEW endpoint)
    const apiUrl = `https://core.pharmyrus.com/api/v1/search?molecule_name=${encodeURIComponent(moleculeName)}`;
    console.log(`[Netlify Proxy] Calling: ${apiUrl}`);
    console.log(`[Netlify Proxy] Timeout: 20 minutes`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const startTime = Date.now();
    
    // Netlify Functions have 10 second timeout by default, but can be extended to 26 seconds max
    // For long API calls (10-15 min), the API itself handles the wait
    // This proxy just forwards the request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Netlify Proxy] Response received!`);
    console.log(`[Netlify Proxy] Duration: ${duration} seconds (~${Math.round(duration/60)} minutes)`);
    console.log(`[Netlify Proxy] Status: ${response.status} ${response.statusText}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      console.error(`[Netlify Proxy] API Error: ${response.status}`);
      console.error(`[Netlify Proxy] Details: ${errorText}`);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `API Error: ${response.status} ${response.statusText}`,
          details: errorText
        })
      };
    }

    const data = await response.json();
    const patentsCount = data.search_result?.patents?.length || 0;
    
    console.log(`[Netlify Proxy] ✅ Success!`);
    console.log(`[Netlify Proxy] Patents found: ${patentsCount}`);
    console.log(`[Netlify Proxy] Molecule: ${data.search_result?.molecule?.molecule_name || 'unknown'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.error('[Netlify Proxy] ❌ ERROR:');
    console.error('[Netlify Proxy] Type:', error.name);
    console.error('[Netlify Proxy] Message:', error.message);
    console.error('[Netlify Proxy] Stack:', error.stack);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Netlify Proxy Error',
        message: error.message,
        type: error.name,
        details: error.toString()
      })
    };
  }
};
