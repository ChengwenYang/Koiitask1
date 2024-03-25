const task = require('./task');


class CoreLogic {
 

  async task(round) {
    try {
      const result = await this.submission.task(round);
      return result;
    } catch (error) {
      console.error('Error in CoreLogic.task:', error);
      throw error;
    }
  }

  async submitTask(round) {
    try {
      const submission = await this.submission.submitTask(round);
      return submission;
    } catch (error) {
      console.error('Error in CoreLogic.submitTask:', error);
      throw error;
    }
  }

  async auditTask(round) {
    await task.audit.auditTask(round);
  }

  async submitDistributionList(round) {
    await task.distribution.submitDistributionList(round);
  }

  async auditDistribution(round) {
    await task.distribution.auditDistribution(round);
  }
}
const coreLogic = new CoreLogic();

module.exports = { coreLogic };
