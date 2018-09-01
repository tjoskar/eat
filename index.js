const terminalImage = require('terminal-image')
const got = require('got')
const terminalLink = require('terminal-link')
const prompts = require('prompts')
const opn = require('opn')
const Configstore = require('configstore')

async function renderRecipe({ url, name, image }) {
  const { body } = await got(image, { encoding: null })
  console.log(await terminalImage.buffer(body))
  console.log(terminalLink(name, url))
}

function bind(fn, ...args) {
  return () => fn.apply(undefined, args)
}

function openUrlAndExit(url) {
  opn(url)
  exit()
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function chnageUrlToDb(conf) {
  const response = await prompts({
    type: 'text',
    name: 'value',
    message: 'Url to the recipe db:',
    validate: value => value.startsWith('http://') || value.startsWith('https://')
  })

  conf.set('url', response.value)
  return response.value
}

async function browseRecipe(recipes) {
  const response = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a good one!',
    choices: recipes.map(recipe => ({
      title: recipe.name,
      value: recipe
    })),
    initial: 0
  })

  openUrlAndExit(response.value.url)
}

const exit = bind(process.exit, 0)

async function getAllRecipes(conf) {
  let url = conf.get('url')
  if (!url) {
    url = await chnageUrlToDb(conf)
  }
  try {
    const { body } = await got(url, { json: true })
    return body
  } catch (error) {
    console.log(`Get not get: ${url}. Do you want to change the url?`, error)
    await chnageUrlToDb(conf)
    return await getAllRecipes(conf)
  }
}

async function randomizeRecipe(conf) {
  const allRecipes = await getAllRecipes(conf)
  const randomRecipe = randomElement(allRecipes)

  await renderRecipe(randomRecipe)

  const response = await prompts({
    type: 'select',
    name: 'value',
    message: 'Sounds good?',
    choices: [
      { title: 'Go to recipe', value: bind(openUrlAndExit, randomRecipe.url) },
      { title: 'Generate a new recipe', value: bind(randomizeRecipe, conf) },
      { title: 'Browse', value: bind(browseRecipe, allRecipes) },
      { title: 'Change url to db', value: bind(chnageUrlToDb, conf) },
      { title: 'Exit', value: exit }
    ],
    initial: 0
  })

  response.value()
}

function run() {
  const conf = new Configstore('tjoskar-eat')
  randomizeRecipe(conf)
}

run()
