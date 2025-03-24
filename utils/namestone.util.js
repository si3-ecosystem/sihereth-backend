const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;

async function registerSubdomain(subdomain, contenthash) {
  const url = "https://namestone.xyz/api/public_v1/set-name";

  const response = await fetch(url, {
    body: JSON.stringify({
      domain: DOMAIN,
      address: ADDRESS,
      contenthash: `ipfs://${contenthash}`,
      name: subdomain,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: NAMESTONE_API_KEY,
    },
  });
  console.log('====',response);

  return response.status === 200;
}

module.exports.registerSubdomain = registerSubdomain;
