const client= require ("./client.js")

async function init() {
  await client.lpush("lists", 2);
  const result=await client.lpush("lists", 1);
  console.log(result);
}

init()