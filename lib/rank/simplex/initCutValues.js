module.exports = initCutValues;

/*
 * Set the cut values of edges in the spanning tree by a depth-first
 * postorder traversal.  The cut value corresponds to the cost, in
 * terms of a ranking's edge length sum, of lengthening an edge.
 * Negative cut values typically indicate edges that would yield a
 * smaller edge length sum if they were lengthened.
 */
function initCutValues(graph, spanningTree) {
  computeLowLim(spanningTree);

  spanningTree.eachEdge(function(id, u, v, treeValue) {
    treeValue.cutValue = 0;
  });

  // Propagate cut values up the tree.
  function dfs(n) {
    var children = spanningTree.successors(n);
    for (var c in children) {
      var child = children[c];
      dfs(child);
    }
    if (n !== spanningTree.graph().root) {
      setCutValue(graph, spanningTree, n);
    }
  }
  dfs(spanningTree.graph().root);
}

/*
 * Perform a DFS postorder traversal, labeling each node v with
 * its traversal order 'lim(v)' and the minimum traversal number
 * of any of its descendants 'low(v)'.  This provides an efficient
 * way to test whether u is an ancestor of v since
 * low(u) <= lim(v) <= lim(u) if and only if u is an ancestor.
 */
function computeLowLim(tree) {
  var postOrderNum = 0;
  
  function dfs(n) {
    var children = tree.successors(n);
    var low = postOrderNum;
    for (var c in children) {
      var child = children[c];
      dfs(child);
      low = Math.min(low, tree.node(child).low);
    }
    tree.node(n).low = low;
    tree.node(n).lim = postOrderNum++;
  }

  dfs(tree.graph().root);
}

/*
 * To compute the cut value of the edge parent -> child, we consider
 * it and any other graph edges to or from the child.
 *          parent
 *             |
 *           child
 *          /      \
 *         u        v
 */
function setCutValue(graph, tree, child) {
  var parentEdge = tree.inEdges(child)[0];

  // List of child's children in the spanning tree.
  var grandchildren = [];
  var grandchildEdges = tree.outEdges(child);
  for (var gce in grandchildEdges) {
    grandchildren.push(tree.target(grandchildEdges[gce]));
  }

  var cutValue = graph.outEdges(child).length - graph.inEdges(child).length;

  // Contributions depend on the alignment of the parent -> child edge
  // and the child -> u or v edges.
  for (var gc in grandchildren) {
    var cv = tree.edge(grandchildEdges[gc]).cutValue;
    if (!tree.edge(grandchildEdges[gc]).reversed) {
      cutValue -= cv;
    } else {
      cutValue += cv;
    }
  }

  if (!tree.edge(parentEdge).reversed) {
    cutValue = -cutValue;
  }

  tree.edge(parentEdge).cutValue = cutValue;
}
