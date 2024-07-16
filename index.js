// const express = require('express');
// const cors = require('cors');
// const { MongoClient, ServerApiVersion } = require('mongodb');
// const bcrypt = require('bcryptjs');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obyjfl3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     // Connect the client to the server
//     await client.connect();

//     const userCollection = client.db('mfsDb').collection('user');

//     app.post('/user', async (req, res) => {
//       const { email, mobile, pin, ...rest } = req.body;
      
//       // Check if email or mobile already exists
//       const existingUser = await userCollection.findOne({
//         $or: [{ email }, { mobile }],
//       });

//       if (existingUser) {
//         res.status(400).send({ error: 'Email or Mobile number already exists' });
//       } else {
//         // Hash the PIN before saving
//         const salt = bcrypt.genSaltSync(10);
//         const hashedPin = bcrypt.hashSync(pin, salt);

//         const newRegister = { email, mobile, pin: hashedPin, ...rest, status: 'pending' };
//         const result = await userCollection.insertOne(newRegister);
//         res.send(result);
//       }
//     });

//     // Send a ping to confirm a successful connection
//     await client.db('admin').command({ ping: 1 });
//     console.log('Pinged your deployment. You successfully connected to MongoDB!');
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

// app.get('/', (req, res) => {
//   res.send('mfs is running');
// });

// app.listen(port, () => {
//   console.log(`mfs is running on port ${port}`);
// });

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obyjfl3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const userCollection = client.db('mfsDb').collection('user');

    app.post('/user', async (req, res) => {
      const { email, mobile, pin, ...rest } = req.body;
      
      // Check if email or mobile already exists
      const existingUser = await userCollection.findOne({
        $or: [{ email }, { mobile }],
      });

      if (existingUser) {
        res.status(400).send({ error: 'Email or Mobile number already exists' });
      } else {
        // Hash the PIN before saving
        const salt = bcrypt.genSaltSync(10);
        const hashedPin = bcrypt.hashSync(pin, salt);

        const newRegister = { email, mobile, pin: hashedPin, ...rest, status: 'pending' };
        const result = await userCollection.insertOne(newRegister);
        res.send(result);
      }
    });

    app.post('/login', async (req, res) => {
      const { email, mobile, pin } = req.body;
      
      // Find the user by email or mobile
      const user = await userCollection.findOne({
        $or: [{ email }, { mobile }],
      });

      if (!user) {
        return res.status(400).send({ error: 'User not found' });
      }

      // Compare the input PIN with the hashed PIN
      const isMatch = await bcrypt.compare(pin, user.pin);

      if (isMatch) {
        res.send({ message: 'Successful login' });
      } else {
        res.status(400).send({ error: 'Invalid PIN' });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('mfs is running');
});

app.listen(port, () => {
  console.log(`mfs is running on port ${port}`);
});


