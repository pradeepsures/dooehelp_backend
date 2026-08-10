const BaseRepository = require('../../../core/BaseRepository');
const Comment = require('../../../models/Comment.model');

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment, 'comment');
  }
}

module.exports = new CommentRepository();
