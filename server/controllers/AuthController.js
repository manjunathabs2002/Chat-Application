import { request, response } from 'express';
import User from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { renameSync, unlink, unlinkSync } from 'fs';

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send('Email and password are required');
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(400).send('Email already exists');
    }
    const user = await User.create({ email, password });
    response.cookie('jwt', createToken(email, user._id), {
      maxAge,
      secure: true,
      sameSite: 'None',
    });
    return response.status(201).json({
      user: {
        email,
        userId: user._id,
        profileSetup: user.profileSetup,
        message: 'User Created',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).send('User with given email not found');
    }
    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.status(400).send('Email or password is incorrect');
    }
    response.cookie('jwt', createToken(email, user._id), {
      maxAge,
      secure: true,
      sameSite: 'None',
    });
    return response.status(200).json({
      user: {
        userId: user._id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userId = request.userId;

    const userData = await User.findById(userId);
    if (!userData) {
      return response.status(404).send('User with given Id not found');
    }
    return response.status(200).json({
      user: {
        userId: userData._id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
      },
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send('Internal server error');
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const userId = request.userId;

    const { firstName, lastName, color } = request.body;
    if (!firstName || !lastName || color === undefined) {
      return response
        .status(400)
        .send('FirstName, LastName and Color are required');
    }

    const userData = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        color,
        profileSetup: true,
      },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      userId: userData._id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send('Internal server error');
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if (!request.file) {
      return response.status(400).send('File is required');
    }

    const date = Date.now();
    let fileName = 'uploads/profiles/' + date + request.file.originalname;
    renameSync(request.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { image: fileName },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send('Internal server error');
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const userId = request.userId;

    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).send('User not found');
    }

    if (user.image) {
      unlinkSync(user.image);
    }

    user.image = null;
    await user.save();

    return response.status(200).send('Profile image removed');
  } catch (error) {
    console.log({ error });
    return response.status(500).send('Internal server error');
  }
};

export const logout = async (request, response, next) => {
  try {
    response.cookie('jwt', '', { maxAge: 1, secure: true, sameSite: 'None' });

    return response.status(200).send('Logout Successfull');
  } catch (error) {
    console.log({ error });
    return response.status(500).send('Internal server error');
  }
};
