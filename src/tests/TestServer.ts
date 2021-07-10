import http from 'http';
import express, { Express, Router, Request, Response } from 'express';

export class TestServer {

    private server: http.Server;
    private router: Router;
    public app: Express;
    
    public constructor(port = 3000, hostname = '127.0.0.1') {
        this.router = express.Router();
        this.app = express();
        this.server = new http.Server(this.app);

        this.app.use("/", this.router);
        this.server.listen(port, hostname);
        this.testRoutes();
    }

    testRoutes(): void {
        this.router.get('/test', (req:Request, res:Response) => res.status(200).send(req.body));

        this.router.post('/test', (req:Request, res:Response) => {
            res.status(200).send(req.body);
        });

        this.router.put('/test', (req:Request, res:Response) => {
            res.status(200).send(req.body);
        });

        this.router.delete('/test', (req:Request, res:Response) => {
            res.status(200).send(req.body);
        });
    }
}