# Classic Post with Apollo

_full stack super basic but functional post board with user authentication and tagging_

![Feb-22-2021 11-05-24 (1)](https://user-images.githubusercontent.com/29664811/108700561-b01ae580-74fe-11eb-873e-62f85b1d8411.gif)

### Technical Features

- Apollo client/server (incl. datasource, cache, subscription, pagination)
- TypeScript
- Authentication with JWT
- MongoDB
- NextJS with SSG/SSR
- SASS

### Usability Features

- Sign up
- Login/out
- Create post
- Update post
- Delete post
- Paginate through all posts
- View own posts/likes
- Add tags to post
- Dis/like post

### Set-up and Develope

_backend_ (express based apollo server with MongoDB)

```
cd backend
npm install
```

To run the database, either et up a MongoDB instance locally or in MongoDB Atlas, save the connection string to the `.env` file.

To seed the database:

```
npm run seed
```

You will have `like, post, tag, user` 4 tables, checking the schema def here:[Schema](./backend/schema/index.ts).

To use the authentication with frontend, add a JWT secrent also in the `.env` file.

You can try with seed users with pwds on [Seeds](./backend/seed/seed.ts)

To start the server:

```
npm run dev
```

The port is listening at `5000` for both websocket and http server.

_frontend_ (NextJS based apollo client )

```
cd frontend
npm install
```

To generate the schema defination, starting the backend server and run:

```
npm run generate
```

Codegen will output the def in [Types](./frontend/types.ts)

To start the server:

```
npm run dev
```

#### Thoughts

- This is a trial with subscription and pagination and it can have some refactoring
- The resolvers are separated from data source to have a lighter and readable shape, but add a data loader will make it even better
- No test warning, definitely need some.
- Some types are hardcoded as `any`
- Need better understanding of SSG/SSR of NextJS
- The app is not deployed as it aims to be refactored to work with DynamoDB and AppSync, Amplify in the future

<img src="https://user-images.githubusercontent.com/29664811/108702210-db9ecf80-7500-11eb-8a7d-320d2e4c01d0.png" width="600">

<img src="https://user-images.githubusercontent.com/29664811/108702418-23bdf200-7501-11eb-986f-23b223a4b906.png" width="600">
