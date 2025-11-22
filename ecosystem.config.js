{
  "apps": [{
    "name": "dairy-farm-api",
    "script": "server/index.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production"
    },
    "error_file": "logs/err.log",
    "out_file": "logs/out.log",
    "log_file": "logs/combined.log",
    "time": true
  }]
}
