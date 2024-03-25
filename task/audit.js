const { namespaceWrapper } = require('../_koiiNode/koiiNode');

class Audit {
  async validateNode(submission_value, round) {
    console.log('SUBMISSION VALUE', submission_value, round);
    let vote;
    try {
      // 解析提交的股票信息
      const submission = JSON.parse(submission_value);
      // 检查是否包含必要的交易数据：日期、时间、成交量、成交价和交易方向
      if (
        submission.date &&
        submission.time &&
        typeof submission.volume === 'number' &&
        typeof submission.price === 'number' &&
        submission.tradeDirection !== undefined // 确保交易方向有值
      ) {
        // 如果所有检查都通过，则验证成功
        vote = true;
      } else {
        // 如果缺少任何信息或类型不正确，则验证失败
        vote = false;
      }
    } catch (e) {
      console.error(e);
      // 如果提交的值无法解析为JSON，也视为验证失败
      vote = false;
    }
    return vote;
  }

  async auditTask(roundNumber) {
    console.log('AuditTask called with round', roundNumber);
    console.log(
      await namespaceWrapper.getSlot(),
      'Current slot while calling auditTask',
    );
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode.bind(this), // 确保在validateNode中使用正确的this引用
      roundNumber,
    );
  }
}

const audit = new Audit();
module.exports = { audit };
