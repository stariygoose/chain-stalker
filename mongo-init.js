const appDb = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);
appDb.createUser({
    user: process.env.MONGO_DB_USERNAME,
    pwd: process.env.MONGO_DB_PASSWORD,
    roles: [{ role: 'dbOwner', db: process.env.MONGO_INITDB_DATABASE }]
});
