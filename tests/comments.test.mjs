import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendReply,
  buildCommentThreadIndex,
  countNestedComments,
  expandCommentAncestors,
  flattenComments,
  insertCommentNewest,
  normalizeCommentOrder,
  toggleCommentLike,
} from '../src/features/comments/application/use-cases/commentThread.ts';

function comment(id, createdAt = 100, replies = []) {
  return {
    id, createdAt, replies, content: id,
    author: { id: 'author', username: 'Author', avatar: '' },
    liked: false, likes: 0,
  };
}

function freezeTree(comments) {
  for (const node of comments) {
    freezeTree(node.replies);
    Object.freeze(node.author);
    Object.freeze(node);
  }
  return Object.freeze(comments);
}

test('normalizes newest-first once, with stable ties and without modifying input', () => {
  const oldReply = comment('old-reply', 10);
  const newReply = comment('new-reply', 20);
  const oldRoot = comment('old', 10, [oldReply, newReply]);
  const newRoot = comment('new', 30);
  const sameTime = comment('same-time', 30);
  const original = freezeTree([oldRoot, newRoot, sameTime]);
  const normalized = normalizeCommentOrder(original);

  assert.deepEqual(normalized.map(({ id }) => id), ['new', 'same-time', 'old']);
  assert.deepEqual(normalized[2].replies.map(({ id }) => id), ['new-reply', 'old-reply']);
  assert.equal(normalized[0], newRoot);
  assert.equal(normalized[2].replies[0], newReply);
  assert.deepEqual(original.map(({ id }) => id), ['old', 'new', 'same-time']);
  assert.equal(normalizeCommentOrder(normalized), normalized);
});

test('insertions retain newest-first ordering and put a new timestamp tie first', () => {
  const original = freezeTree([comment('new', 30), comment('old', 10)]);
  assert.deepEqual(insertCommentNewest(original, comment('middle', 20)).map(({ id }) => id), ['new', 'middle', 'old']);
  assert.deepEqual(insertCommentNewest(original, comment('tie', 30)).map(({ id }) => id), ['tie', 'new', 'old']);
  assert.deepEqual(insertCommentNewest(original, comment('earlier', 1)).map(({ id }) => id), ['new', 'old', 'earlier']);
});

test('liking a nested comment updates its ancestry and preserves all unrelated branches', () => {
  const target = comment('target');
  const sibling = comment('sibling', 100, [comment('sibling-child')]);
  const otherRoot = comment('other-root', 100, [comment('other-child')]);
  const original = freezeTree([comment('root', 100, [target, sibling]), otherRoot]);
  const updated = toggleCommentLike(original, 'target');

  assert.notEqual(updated, original);
  assert.notEqual(updated[0], original[0]);
  assert.equal(updated[0].replies[0].liked, true);
  assert.equal(updated[0].replies[0].likes, 1);
  assert.equal(updated[0].replies[0].replies, target.replies);
  assert.equal(updated[0].replies[1], sibling);
  assert.equal(updated[1], otherRoot);
  assert.equal(toggleCommentLike(updated, 'target')[0].replies[0].likes, 0);
  assert.equal(original[0].replies[0].liked, false);
});

test('reply insertion preserves unrelated identities and missing targets are no-ops', () => {
  const target = comment('target', 100, [comment('previous', 20)]);
  const otherRoot = comment('other-root');
  const original = freezeTree([comment('root', 100, [target]), otherRoot]);
  const reply = comment('reply', 30);
  const updated = appendReply(original, 'target', reply);

  assert.equal(updated[0].replies[0].replies[0], reply);
  assert.equal(updated[0].replies[0].replies[1], target.replies[0]);
  assert.equal(updated[1], otherRoot);
  assert.equal(appendReply(original, 'missing', reply), original);
  assert.equal(toggleCommentLike(original, 'missing'), original);
  const expanded = { root: false };
  assert.equal(expandCommentAncestors(expanded, 'missing', buildCommentThreadIndex(original)), expanded);
});

test('flattening uses existing comment objects and counts descendants even while collapsed', () => {
  const nested = comment('nested');
  const reply = comment('reply', 100, [nested]);
  const root = comment('root', 100, [reply]);
  const original = freezeTree([root]);
  const index = buildCommentThreadIndex(original);
  const collapsed = flattenComments(original, {}, index);
  const expanded = flattenComments(original, { root: true, reply: true }, index);

  assert.equal(index.totalCount, 3);
  assert.equal(countNestedComments(original), 3);
  assert.equal(index.parentById.get('nested'), 'reply');
  assert.deepEqual(collapsed.map(({ id }) => id), ['root', 'toggle-root']);
  assert.equal(collapsed[1].repliesCount, 2);
  assert.equal(collapsed[0].comment, expanded[0].comment);
  assert.equal(expanded[2].comment, nested);
  assert.deepEqual(expanded.map(({ id }) => id), ['root', 'reply', 'nested', 'toggle-reply', 'toggle-root']);
});

test('sending to a nested reply reopens collapsed ancestors and exposes the new row', () => {
  const original = freezeTree([comment('root', 100, [comment('reply')]), comment('untouched')]);
  const expansion = { root: false, reply: false, untouched: false };
  const expanded = expandCommentAncestors(expansion, 'reply', buildCommentThreadIndex(original));
  const updated = appendReply(original, 'reply', comment('sent', 200));
  const rows = flattenComments(updated, expanded);

  assert.equal(expanded.root, true);
  assert.equal(expanded.reply, true);
  assert.equal(expanded.untouched, false);
  assert.equal(expansion.root, false);
  assert.ok(rows.some(({ id }) => id === 'sent'));
  assert.equal(buildCommentThreadIndex(updated).totalCount, 4);
});

test('index and flatten support large deep threads without recursive traversal or lost rows', () => {
  const depth = 5000;
  let tree = [];
  const expanded = {};
  for (let index = depth - 1; index >= 0; index -= 1) {
    tree = [comment(`node-${index}`, index, tree)];
    expanded[`node-${index}`] = true;
  }
  const index = buildCommentThreadIndex(tree);
  assert.equal(index.totalCount, depth);
  assert.equal(index.descendantCountById.get('node-0'), depth - 1);
  assert.equal(flattenComments(tree, {}, index).length, 2);
  const rows = flattenComments(tree, expanded, index);
  assert.equal(rows.length, depth * 2 - 1);
  assert.equal(rows[depth - 1].id, `node-${depth - 1}`);
});

test('empty comments produce empty rows and a zero count', () => {
  assert.deepEqual(flattenComments([], {}), []);
  assert.equal(countNestedComments([]), 0);
});
