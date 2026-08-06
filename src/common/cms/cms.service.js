const BaseService = require('../../core/BaseService');
const cmsRepository = require('./cms.repository');

class CmsService extends BaseService {
  constructor() {
    super(cmsRepository, 'cms');
  }

  async getCms(type, page) {
    const cms = await this.repository.findByTypeAndPage(type, page);
    // If not found, you can either throw an AppError or return a default empty object
    if (!cms) {
      return { type, page, content: '' };
    }
    return cms;
  }

  async updateCms(type, page, content) {
    const cms = await this.repository.upsert(type, page, content);
    return cms;
  }
}

module.exports = new CmsService();
