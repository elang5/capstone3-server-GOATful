'use strict';

const path = require('path');
const express = require('express');
const jsonParser = express.json();
const xss = require('xss');
const Joi = require('joi');
const videoSchema = require('./video-schema');
const videosRouter = express.Router();
const VideoService = require('./video-service');
const previewsRouter = require('../previews/previews-router')
const { requireAuth } = require('../middleware/jwt-auth')

const serializeVideo = video => ({
  id: video.id,
  active_thumbnail_url: video.active_thumbnail_url,
  title: xss(video.title),
  preview_count: video.preview_count,
  is_active: video.is_active,
  video_length: xss(video.video_length),
  youtube_display_name: xss(video.youtube_display_name),
  youtube_url: video.youtube_url,
  tags: video.tags,
  user_id: video.user_id
});

videosRouter
  .route('/')
  .get(requireAuth, async (req, res, next) => {
    const user_id = req.user.id ;
    try {
      const videos = await VideoService.list(req.app.get('db'), user_id);
      return res.status(200).json(videos);
    } catch(err) {
      next({status: 500, message: err.message});
    }
  })
  .post(requireAuth, jsonParser, async (req, res, next) => {
    const { title, video_length, youtube_display_name, tags } = req.body;
    const user_id = req.user.id ;
    let newVideo = { title, video_length, youtube_display_name, tags, user_id };

    const validVideo = videoSchema.validate(newVideo);
    if (validVideo.error) {
      return next({status: 400, message: validVideo.error.details[0].message});
    }
    
    try {
      // let validation = await Joi.validate(newVideo);
      // newVideo = validation;
      const newVideoPost = await VideoService.insertVideo(req.app.get('db'), newVideo);
      const serializedVideo = serializeVideo(newVideoPost);
      return res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${serializedVideo.id}`))
        .json(serializedVideo);
    } catch(err) {
      next({ status: 400, message: err.details[0].message || err.message });
    }
  });

videosRouter
  .route('/:video_id')
  .all(requireAuth, async (req, res, next) => {
    try {
      const video = await VideoService.getVideoById(req.app.get('db'), req.params.video_id);
      if (video.length < 1) {
        return res.status(404).json({ error: { message: 'Video doesn\'t exist' } });
      }
      res.video = video[0];
      next();
    } catch(err) {
      next({ status: 500, message: err.message });
    }
  })
  .get((req, res, next) => {
    res.json(serializeVideo(res.video));
  })
  .patch(requireAuth, jsonParser, async (req, res, next) => {
    const { title, video_length, youtube_display_name, tags } = req.body;
    const user_id = req.user.id;
    const videoToUpdate = { title, video_length, youtube_display_name, tags, user_id };
      
    const requiredFields = [ 'title', 'video_length', 'youtube_display_name', 'tags', 'user_id' ];
    let allowed = new Set(requiredFields);
    let supplied = Object.keys(req.body);
    let validated = supplied.filter(x => allowed.has(x));
    if (validated.length < 1) 
      return res.status(400).json({
        error: { message: 'Request body must contain either \'title\', \'video_length\', \'youtube_display_name\', or \'tags\'' }
      });
    try {
      await VideoService.updateVideo(req.app.get('db'), req.params.video_id, videoToUpdate);
      return res.status(204).end();
    } catch(err) {
      next({ status: 500, message: err.message });
    }
  });

  videosRouter.use('/:video_id/previews', previewsRouter)

module.exports = videosRouter;