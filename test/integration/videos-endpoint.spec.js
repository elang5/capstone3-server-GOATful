'use strict';
/* globals supertest */
const knex = require('knex');
const app = require('../../src/app');
const helpers = require('../test-helpers');
const VideoService = require('../../src/videos/video-service');
require('dotenv').config();
const secret = process.env.JWT_SECRET;

const badVidz = [
  {
    id: 1,
    title: 'First test video!',
    active_thumbnail_url: 'http://placehold.it/500x500',
    preview_count: 2,
    is_active: true,
    video_length: '10:01',
    youtube_display_name: 'erevrve',
    youtube_url: 'https://www.youtube.com/watch?v=wJ0QXCTqjUs',
    tags: ['foo', 'bar', 'baz'],
    user_id: 2,
  },
  {
    id: 2,
    title: 'Second test video!',
    preview_count: 0,
    is_active: false,
    video_length: '5:47',
    youtube_display_name: 'testNmae',
    tags: ['magic', 'talent'],
    user_id: 2
  }
];

describe('Videos Endpoints', function() {
  let db;

  const {
    testUsers,
    testVideos,
    testPreviews,
  } = helpers.makeFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('GET /api/videos', () => {
    
    context('Given no videos', () => {
      beforeEach('insert videos', () =>
      helpers.seedTables(
        db,
        testUsers,
        badVidz,
        testPreviews
      )
    );

      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/videos')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .expect(200, []);
      });
    });

    context('Given videos', () => {
      beforeEach('insert videos', () =>
        helpers.seedTables(
          db,
          testUsers,
          testVideos,
          testPreviews,
        )
      );
      it('responds with 200 and array of video objects', () => {
        return supertest(app)
          .get('/api/videos')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .expect(200)
          .then(async res => {
            const videos = await VideoService.list(db, testUsers[0].id);
            // delete videos[0].created_at;
            // delete videos[0].updated_at;
            expect(res.body.length).to.equal(videos.length);
            expect(res.body[0].id).to.equal(videos[0].id);
          });
      });
    });
  });
  describe('POST /api/videos', () => {
    const testUsers = helpers.makeUsersArray()
    beforeEach('insert users', () => {
      return helpers.seedUsers(db, testUsers)
    })
    afterEach('cleanup', () => helpers.cleanTables(db));
    it('creates a video, responding with 201 and the new video', () => {
      const newVideo = {
        title: 'test',
        video_length: '03:30',
        youtube_display_name: 'tester',
        tags: ['test1', 'test2', 'test3']
      }
      return supertest(app)
        .post('/api/videos')
        .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
        .send(newVideo)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newVideo.title)
          expect(res.body.video_length).to.eql(newVideo.video_length)
          expect(res.body.youtube_display_name).to.eql(newVideo.youtube_display_name)
          expect(res.body.tags).to.eql(newVideo.tags)
          expect(res.body).to.have.property('id')
        })
    })
    
    const requiredFields = ['title', 'video_length', 'youtube_display_name', 'tags']

    requiredFields.forEach(field => {
      const newVideo = {
        title: 'Test video',
        video_length: '03:30',
        youtube_display_name: 'elan',
        tags: ['test1', 'test2', 'test3']
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newVideo[field]

        return supertest(app)
          .post('/api/videos')
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .send(newVideo)
          .expect(400, {
            message: `"${field}" is required`
          })
      })
    })
  })
  describe(`GET /api/videos/:video_id`, () => {
    context('Given there are videos in the database', () => {
      const testUsers = helpers.makeUsersArray()
      const testVideos = helpers.makeVideosArray(testUsers)

      beforeEach('insert videos', () => 
        helpers.seedTables(
          db,
          testUsers,
          testVideos
        )
      )
      

      it('responds with 200 and the specified video', () => {
        const videoId = 1
        const expectedVideo = testVideos[videoId - 1]
        return supertest(app)
          .get(`/api/videos/${videoId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .expect(200, expectedVideo)
      })
      it('responds with 404 and an error when the video does not exist', () => {
        const videoId = 12394
        return supertest(app)
          .get(`/api/videos/${videoId}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .expect(404, {
            error: { message: `Video doesn't exist` }
          })
      })
    })
  })

  describe(`PATCH /api/videos/:video_id`, () => {
    context('Given there are videos in the database', () => {
      const testUsers = helpers.makeUsersArray()
      const testVideos = helpers.makeVideosArray(testUsers)

      beforeEach('insert videos', () => 
        helpers.seedTables(
          db,
          testUsers,
          testVideos
        )
      )

      it('responds with 204 and updates the article', () => {
        const idToUpdate = 1
        const updatedVideo = {
          title: 'New test title'
        }
        const expectedVideo = {
          ...testVideos[idToUpdate - 1],
          ...updatedVideo
        }
        return supertest(app)
          .patch(`/api/videos/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .send(updatedVideo)
          .expect(204)
          .then(res => 
            supertest(app)
            .get(`/api/videos/${idToUpdate}`)
            .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
            .expect(expectedVideo))
      })

      it(`responds with 400 when no required fields are supplied`, () => {
        const idToUpdate = 1
        return supertest(app)
          .patch(`/api/videos/${idToUpdate}`)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], secret, '10000ms'))
          .send({ irrelevantField: 'foobar' })
          .expect(400, {
            error: { message: `Request body must contain either 'title', 'video_length', 'youtube_display_name', or 'tags'` }
          })
      })
    })
  })
});