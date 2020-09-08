use lol-scrapped-data
db.dropDatabase()

db.summoners.insertOne({
    "accountId" : "TH84YE32Ghfqo6OxQiy-Mhs5j0B4jA_E7EWKV4kFN91j-Q",
    "name" : "kortyElBo3bo3",
    "platformId" : "EUN1",
    "state": "initial"
})
db.summoners.insertOne({
    "accountId" : "0vnHjl_ZcyiyyZ-NB9x0PTN3yEJ0CfLNcjcf9hLqeZ8CfQ",
    "name" : "Incendius",
    "platformId" : "EUW1",
    "state": "initial"
})
db.summoners.insertOne({
    "accountId" : "s4KJfYG601ydS_xAYyTy_S8b8sVbIut2E7BmUNohSTkal28",
    "name" : "Linzi",
    "platformId" : "NA1",
    "state": "initial"
})

db.matches.createIndex({ gameId: 1 }, { unique: true })
db.matchtimelines.createIndex({ gameId: 1 }, { unique: true })
db.matchlistquery.createIndex({ queryId: 1 }, { unique: true })
db.summoners.createIndex({ accountId: 1, platformId: 1}, { unique: true })

db.matches.createIndex({ state: 1 })
db.matchtimelines.createIndex({ gameId: 1 })
db.matchlistquery.createIndex({ state: 1 })

db.matches.createIndex({ state: 1 })
db.matchtimelines.createIndex({ gameId: 1 })
db.matchlistquery.createIndex({ state: 1 })
db.summoners.createIndex({ accountId: 1 })