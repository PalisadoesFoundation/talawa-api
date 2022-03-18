const Post = require('../../models/Post');

module.exports = async (parent, args) => {
  var sort = {};
  var isSortingExecuted = args.orderBy !== null;

  //Sorting List
  if (isSortingExecuted) {
    if (args.orderBy === 'id_ASC') {
      sort = { _id: 1 };
    } else if (args.orderBy === 'id_DESC') {
      sort = { _id: -1 };
    } else if (args.orderBy === 'text_ASC') {
      sort = { text: 1 };
    } else if (args.orderBy === 'text_DESC') {
      sort = { text: -1 };
    } else if (args.orderBy === 'title_ASC') {
      sort = { title: 1 };
    } else if (args.orderBy === 'title_DESC') {
      sort = { title: -1 };
    } else if (args.orderBy === 'createdAt_ASC') {
      sort = { createdAt: 1 };
    } else if (args.orderBy === 'createdAt_DESC') {
      sort = { createdAt: -1 };
    } else if (args.orderBy === 'imageUrl_ASC') {
      sort = { imageUrl: 1 };
    } else if (args.orderBy === 'imageUrl_DESC') {
      sort = { imageUrl: -1 };
    } else if (args.orderBy === 'videoUrl_ASC') {
      sort = { videoUrl: 1 };
    } else if (args.orderBy === 'videoUrl_DESC') {
      sort = { videoUrl: -1 };
    } else if (args.orderBy === 'likeCount_ASC') {
      sort = { likeCount: 1 };
    } else if (args.orderBy === 'likeCount_DESC') {
      sort = { likeCount: -1 };
    } else if (args.orderBy === 'commentCount_ASC') {
      sort = { commentCount: 1 };
    } else {
      sort = { commentCount: -1 };
    }
  }

  const p = await Post.find({
    organization: args.id,
  })
    .sort(sort)
    .populate('organization')
    .populate('likedBy')
    .populate({
      path: 'comments',
      populate: {
        path: 'creator',
      },
    })
    .populate('creator', '-password');

  const posts = p.map((post) => {
    post.likeCount = post.likedBy.length || 0;
    post.commentCount = post.comments.length || 0;
    return post;
  });
  if (sort.likeCount) {
    sort.likeCount === 1
      ? posts.sort((a, b) => a.likeCount - b.likeCount)
      : posts.sort((a, b) => b.likeCount - a.likeCount);
  } else if (sort.commentCount) {
    sort.commentCount === 1
      ? posts.sort((a, b) => a.commentCount - b.commentCount)
      : posts.sort((a, b) => b.commentCount - a.commentCount);
  }
  return posts;
};
