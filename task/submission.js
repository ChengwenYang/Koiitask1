const axios = require('axios');
const {namespaceWrapper} = require('../_koiiNode/koiiNode.js');
const fs = require('fs');
const { SpheronClient, ProtocolEnum } = require('@spheron/storage');
class Submission {
  constructor() {
    //this.stockSymbol = '000001'; // 以“000001”作为监控的股票符号示例
  }

  // 使用 axios 获取股票信息
  async fetchStockInfo() {
    // 注意替换"您的licence"为您的实际API许可证
   // const apiKey = 'b997d4403688d5e65a'; 
    const url = `http://api.mairui.club/hsrl/zbdd/000001/b997d4403688d5e65a`;

    try {
      const response = await axios.get(url);
      const data = response.data;
      console.log(this.formatStockInfo(data));
      return this.formatStockInfo(data); // 格式化并返回股票信息
    } catch (error) {
      console.error(`Error fetching stock info`, error);
      throw error; // 向上抛出异常
    }
  }

  // 格式化股票信息
  formatStockInfo(stockData) {
    // 假设我们只关注最新的一笔交易数据，可以根据需要调整
    const latestTrade = stockData[0]; // 取第一条数据作为最新交易数据
    const formattedData = {
      date: latestTrade['d'], // 数据归属日期
      time: latestTrade['t'], // 时间
      volume: parseInt(latestTrade['v'], 10), // 成交量
      price: parseFloat(latestTrade['p']), // 成交价
      tradeDirection: latestTrade['ts'], // 交易方向
      timestamp: new Date() // 使用当前时间作为时间戳
    };

    return formattedData;
  }

  // 任务执行逻辑
  async task(round) {
    try {
      console.log(`ROUND ${round}: Fetching and storing stock info`);
      const stockInfo = await this.fetchStockInfo();
      // 存储获取到的股票信息
      await namespaceWrapper.storeSet('stockInfo', JSON.stringify(stockInfo));
      console.log('Stored stock info:', stockInfo);
      
      return stockInfo;
    } catch (err) {
      console.error('ERROR IN EXECUTING TASK:', err);
      throw err; // 向上抛出异常
    }
  }

  // 提交股票信息
  async submitTask(roundNumber) {
    console.log('SubmitTask called with round', roundNumber);
    try {
      const currentSlot = await namespaceWrapper.getSlot();
      console.log('Current slot while calling submit:', currentSlot);

      const submission = await this.fetchSubmission(roundNumber);
      console.log('SUBMISSION:', submission);

      await namespaceWrapper.checkSubmissionAndUpdateRound(submission, roundNumber);
      console.log('After the submission call');
      return submission;
    } catch (error) {
      console.error('Error in submission:', error);
      throw error; // 向上抛出异常
    }
  }

  // 获取提交的股票信息
  async fetchSubmission(round) {
    console.log('IN FETCH SUBMISSION for round:', round);
    const value = await namespaceWrapper.storeGet('stockInfo'); // 检索存储的股票信息
    console.log('Fetched stock info:', value);
    //test only
    cid = await this.uploadIPFS(value, round);
    return cid;
  }

  uploadIPFS = async function (data, round) {
    // Use a dynamic file name including the round number to prevent overwrites and ensure unique paths for each upload.
    let proofPath = `proofs-round-${round}.json`;
    let basePath = '';
  
    try {
      // Try to get the base path and prepare the full file path
      basePath = await namespaceWrapper.getBasePath();
      const fullPath = `${basePath}/${proofPath}`;
      // Write the round data to a file in preparation for uploading
      fs.writeFileSync(fullPath, JSON.stringify(data));
      console.log(`Data for round ${round} written to ${fullPath} successfully.`);
    } catch (err) {
      console.error(`Failed to write data to file for round ${round}:`, err);
      throw err; // Re-throw to handle the error upstream
    }
  
    let attempts = 0;
    const maxRetries = 3;
    while (attempts < maxRetries) {
      try {
        // Attempt to upload the file to IPFS
        let spheronData = await storageClient.upload(fullPath, {
          protocol: ProtocolEnum.IPFS,
          name: `taskData-round-${round}`,
          onUploadInitiated: uploadId => console.log(`Upload initiated with ID: ${uploadId} for round ${round}`),
          onChunkUploaded: (uploadedSize, totalSize) => console.log(`Uploaded ${uploadedSize} of ${totalSize} bytes for round ${round}.`),
        });
  
        console.log(`Data for round ${round} uploaded to IPFS with CID: ${spheronData.cid}`);
  
        // Attempt to clean up the local file after successful upload
        try {
          fs.unlinkSync(fullPath);
          console.log(`Temporary file for round ${round} deleted successfully.`);
        } catch (cleanupErr) {
          console.warn(`Failed to delete temporary file for round ${round}:`, cleanupErr);
        }
  
        return spheronData.cid; // Return the CID after successful upload
      } catch (uploadErr) {
        console.error(`Failed to upload data for round ${round} to IPFS:`, uploadErr);
        attempts++;
        if (attempts < maxRetries) {
          console.log(`Retrying upload for round ${round}... (${attempts}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before retrying
        } else {
          console.error(`Max retries reached for uploading data of round ${round} to IPFS.`);
          throw uploadErr; // Throw error after exceeding max retries
        }
      }
    }
  };
  
}

const submission = new Submission();
module.exports = { submission };