const axios = require('axios');

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
      return this.formatStockInfo(data); // 格式化并返回股票信息
    } catch (error) {
      console.error(`Error fetching stock info for ${this.stockSymbol}:`, error);
      throw error; // 向上抛出异常
    }
  }

  // 格式化股票信息
  formatStockInfo(stockData) {
    // 假设我们只关注最新的一笔交易数据，可以根据需要调整
    const latestTrade = stockData[0]; // 取第一条数据作为最新交易数据
    const formattedData = {
      date: latestTrade['d_'], // 数据归属日期
      time: latestTrade['t_'], // 时间
      volume: parseInt(latestTrade['v_'], 10), // 成交量
      price: parseFloat(latestTrade['p_']), // 成交价
      tradeDirection: latestTrade['ts_'], // 交易方向
      timestamp: new Date() // 使用当前时间作为时间戳
    };

    return formattedData;
  }

  // 任务执行逻辑
  async task(round) {
    try {
      console.log(`ROUND ${round}: Fetching and storing stock info for ${this.stockSymbol}`);
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
    return value;
  }
}
