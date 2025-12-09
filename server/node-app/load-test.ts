// Load Testing Script for /health endpoint
// Progressive load test to find maximum capacity

import http from 'http';

interface TestResult {
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTime: number;
  requestsPerSecond: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

class LoadTester {
  private host: string;
  private port: number;
  private path: string;

  constructor(host: string = 'localhost', port: number = 3000, path: string = '/health') {
    this.host = host;
    this.port = port;
    this.path = path;
  }

  private async makeRequest(): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const options = {
        hostname: this.host,
        port: this.port,
        path: this.path,
        method: 'GET',
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const endTime = Date.now();
          const latency = endTime - startTime;
          if (res.statusCode === 200) {
            resolve(latency);
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  async runTest(concurrency: number, totalRequests: number): Promise<TestResult> {
    console.log(`\n🔄 Testing with ${concurrency} concurrent connections, ${totalRequests} total requests...`);
    
    const startTime = Date.now();
    let completedRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies: number[] = [];
    let activeRequests = 0;

    return new Promise((resolve) => {
      const sendRequest = async () => {
        if (completedRequests >= totalRequests) return;

        activeRequests++;
        
        try {
          const latency = await this.makeRequest();
          successfulRequests++;
          latencies.push(latency);
        } catch (error) {
          failedRequests++;
        } finally {
          completedRequests++;
          activeRequests--;

          if (completedRequests < totalRequests) {
            sendRequest();
          } else if (activeRequests === 0) {
            const endTime = Date.now();
            const totalTime = (endTime - startTime) / 1000; // Convert to seconds
            
            latencies.sort((a, b) => a - b);

            const result: TestResult = {
              concurrency,
              totalRequests,
              successfulRequests,
              failedRequests,
              totalTime,
              requestsPerSecond: successfulRequests / totalTime,
              avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
              minLatency: latencies[0] || 0,
              maxLatency: latencies[latencies.length - 1] || 0,
              p50Latency: this.calculatePercentile(latencies, 50),
              p95Latency: this.calculatePercentile(latencies, 95),
              p99Latency: this.calculatePercentile(latencies, 99),
            };

            resolve(result);
          }
        }
      };

      // Start concurrent requests
      for (let i = 0; i < Math.min(concurrency, totalRequests); i++) {
        sendRequest();
      }
    });
  }

  printResult(result: TestResult) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results');
    console.log('='.repeat(60));
    console.log(`Concurrency:           ${result.concurrency}`);
    console.log(`Total Requests:        ${result.totalRequests}`);
    console.log(`Successful:            ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed:                ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Total Time:            ${result.totalTime.toFixed(2)}s`);
    console.log(`\n⚡ Performance Metrics:`);
    console.log(`Requests/sec:          ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`Avg Latency:           ${result.avgLatency.toFixed(2)}ms`);
    console.log(`Min Latency:           ${result.minLatency.toFixed(2)}ms`);
    console.log(`Max Latency:           ${result.maxLatency.toFixed(2)}ms`);
    console.log(`P50 Latency:           ${result.p50Latency.toFixed(2)}ms`);
    console.log(`P95 Latency:           ${result.p95Latency.toFixed(2)}ms`);
    console.log(`P99 Latency:           ${result.p99Latency.toFixed(2)}ms`);
    console.log('='.repeat(60));
  }

  async runProgressiveTest() {
    console.log('\n🚀 Starting Progressive Load Test for /health endpoint');
    console.log(`Target: http://${this.host}:${this.port}${this.path}\n`);

    // Check if server is up
    try {
      await this.makeRequest();
      console.log('✅ Server is responding\n');
    } catch (error) {
      console.error('❌ Server is not responding. Please start the server first.');
      console.error('   Run: cd server/node-app && yarn dev\n');
      process.exit(1);
    }

    const testConfigs = [
      { concurrency: 10, requests: 1000, name: 'Light Load' },
      { concurrency: 50, requests: 5000, name: 'Medium Load' },
      { concurrency: 100, requests: 10000, name: 'Heavy Load' },
      { concurrency: 200, requests: 20000, name: 'Very Heavy Load' },
      { concurrency: 500, requests: 50000, name: 'Extreme Load' },
      { concurrency: 1000, requests: 100000, name: 'Maximum Load' },
    ];

    const results: TestResult[] = [];

    for (const config of testConfigs) {
      console.log(`\n${'█'.repeat(60)}`);
      console.log(`🔥 ${config.name} Test`);
      console.log(`${'█'.repeat(60)}`);
      
      const result = await this.runTest(config.concurrency, config.requests);
      this.printResult(result);
      results.push(result);

      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log('\n\n' + '█'.repeat(60));
    console.log('📈 SUMMARY - All Tests');
    console.log('█'.repeat(60));
    console.log('\nTest Name'.padEnd(20) + 'RPS'.padEnd(15) + 'Avg Latency'.padEnd(15) + 'Success Rate');
    console.log('-'.repeat(60));
    
    testConfigs.forEach((config, index) => {
      const result = results[index];
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(2);
      console.log(
        config.name.padEnd(20) + 
        result.requestsPerSecond.toFixed(2).padEnd(15) + 
        `${result.avgLatency.toFixed(2)}ms`.padEnd(15) + 
        `${successRate}%`
      );
    });

    console.log('\n' + '█'.repeat(60));
    console.log('🎯 Maximum Capacity Analysis');
    console.log('█'.repeat(60));
    
    const bestResult = results.reduce((prev, current) => 
      current.requestsPerSecond > prev.requestsPerSecond ? current : prev
    );

    console.log(`\n✨ Best Performance:`);
    console.log(`   Concurrency: ${bestResult.concurrency}`);
    console.log(`   Max RPS: ${bestResult.requestsPerSecond.toFixed(2)}`);
    console.log(`   Avg Latency: ${bestResult.avgLatency.toFixed(2)}ms`);
    console.log(`   Success Rate: ${((bestResult.successfulRequests / bestResult.totalRequests) * 100).toFixed(2)}%`);
    
    console.log('\n💡 Recommendations:');
    if (bestResult.requestsPerSecond < 1000) {
      console.log('   - Consider optimizing database queries');
      console.log('   - Enable caching for frequently accessed data');
      console.log('   - Review middleware overhead');
    } else if (bestResult.requestsPerSecond < 5000) {
      console.log('   - Good performance for a Node.js app');
      console.log('   - Consider clustering for higher load');
      console.log('   - Monitor memory usage under sustained load');
    } else {
      console.log('   - Excellent performance!');
      console.log('   - Ready for production workloads');
      console.log('   - Consider load balancing for even higher capacity');
    }
    
    console.log('\n');
  }
}

// Run the test
const tester = new LoadTester();
tester.runProgressiveTest().catch(console.error);
