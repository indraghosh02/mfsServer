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
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

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

    app.post('/jwt', async(req, res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
     
      })
      .send({success:true})
    })


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

    // Assuming you have a route for logout in your Express app
    app.post('/logout', (req, res) => {
      res.clearCookie('token').send({ message: 'Logged out successfully' });
    });


    app.get('/userrole/:input', async (req, res) => {
      const userInput = req.query.input;
      console.log('user on backend::::', userInput);
      
     
        const user = await userCollection.findOne({
          $or: [{ email: userInput }, { mobile: userInput }],
        });
    
       
    
        const { role } = user;
        console.log('Role on Backend',user);
        res.json({ user });
      } 
    );
    
  

    // Get users with role "User" or "Agent"
app.get('/users', async (req, res) => {
  try {
    const users = await userCollection.find({ role: { $in: ['User', 'Agent'] } }).toArray();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});


// Update user status
app.patch('/user/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await userCollection.updateOne(
      { _id: ObjectId(id) }, // Convert id string to ObjectId
      { $set: { status } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating user status' });
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


