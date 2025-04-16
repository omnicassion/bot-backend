const express = require('express');
const User = require('../models/User');
const Alert = require('../models/Alert');
const adminRouter = express.Router();


// Get all user doctor alert count
adminRouter.get('/adminCount', async (req, res) => {
  try {
    const user = await User.find({role: { $ne: "admin" }}).count();
    const doctor = await User.find({role:"doctor"}).count();
    const alerts = await Alert.find().count();
    res.status(200).json({users:user,alerts:alerts,doctor:doctor});
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reports');
  }
});

// Get all users
adminRouter.get('/userData', async (req, res) => {
  try {
const users = await User.find({ role: { $ne: "admin" } });
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reports');
  }
});
// update role
adminRouter.put('/updateRole/:id', async (req, res) => {
  try {
const users = await User.findByIdAndUpdate({_id:req.params.id},{role:req.body.role},{new :true})
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reports');
  }
});
module.exports=adminRouter
