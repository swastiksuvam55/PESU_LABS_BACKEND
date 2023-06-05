# Blog API

This is a RESTful API for a blogging application.

## Getting Started

To get started with the API, follow these steps:

1. Clone the repository.
2. Install the dependencies by running `npm install`.
3. Set up the environment variables in a `.env` file.
4. Start the server by running `npm start`.

## API Endpoints

### User Registration Endpoint

- Route: `POST /api/register`

### User Login Endpoint

- Route: `POST /api/login`

### Create a new blog post

- Route: `POST /api/posts`

### Update a blog post

- Route: `PUT /api/posts/:postId`

### Delete a blog post

- Route: `DELETE /api/posts/:postId`

### Add a comment to a blog post

- Route: `POST /api/posts/:postId/comments`

### Update a comment on a blog post

- Route: `PUT /api/posts/:postId/comments/:commentId`

### Delete a comment from a blog post

- Route: `DELETE /api/posts/:postId/comments/:commentId`

### Fetch a user's profile

- Route: `GET /api/users/:userId`

### Fetch a user's activity feed

- Route: `GET /api/users/:userId/feed`

### Like a post

- Route: `POST /api/posts/:postId/like`

### Unlike a post

- Route: `DELETE /api/posts/:postId/like`

Please note that the `:postId`, `:commentId`, and `:userId` in the routes are parameters that should be replaced with the actual values when making requests.

## Error Handling

The API handles errors using an error handling middleware. If any errors occur during the API's execution, an appropriate error response will be returned.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

## Contributing

Contributions are welcome! If you find any issues with the API or have any suggestions, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
