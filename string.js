const client= require ("./client.js")

async function init() {

  await client.set("user:6","pokemon")
  await client.expire("user:6",10) // expires this key after 10 seconds
  const result = await client.get("user:6");
  console.log(result);
}

init()