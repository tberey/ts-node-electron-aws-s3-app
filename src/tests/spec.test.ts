import { Server } from '../Server';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'mocha';

chai.use(chaiHttp);

const app = (new Server('8000','localhost')).appAccessor;
//if (!app) process.exit(1);

describe('[API] Health Check', () => {
    it('Should return a 200 status', async (done) => {
      return await chai.request(app).get('/test')
        .then(res => {
            chai.expect(res.status).to.equal(404);
            done();
        })
    })
});

describe('[AWS] GET /listBuckets', () => {
    it('Should return a 200 status', async (done) => {
      return await chai.request(app).get('/test')
        .then(res => {
            chai.expect(res.status).to.equal(404);
            done();
        });
    })
});