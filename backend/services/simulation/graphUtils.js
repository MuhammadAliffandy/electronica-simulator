/**
 * Builds an adjacency list from the React Flow edges.
 */
function buildAdjacencyList(nodes, edges) {
  const adj = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push({ node: e.target, fromPin: e.sourceHandle, toPin: e.targetHandle });
    if (adj[e.target]) adj[e.target].push({ node: e.source, fromPin: e.targetHandle, toPin: e.sourceHandle });
  });
  return adj;
}

/**
 * Checks for open pins in the circuit (nodes with < 2 connections).
 */
function checkConnectivity(nodes, adj, errorNodes) {
  let hasOpenPins = false;
  nodes.forEach(n => {
    if ((adj[n.id] || []).length < 2) {
      errorNodes[n.id] = "Koneksi terbuka! Komponen ini bukan bagian dari loop yang tertutup.";
      hasOpenPins = true;
    }
  });
  return hasOpenPins;
}

/**
 * Perform a BFS to check polarity or paths between nodes.
 */
function bfsPathExists(adj, startNodeId, targetNodeId, excludeNodeId) {
  const visited = new Set();
  const queue = [startNodeId];
  visited.add(startNodeId);
  
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === targetNodeId) return true;
    
    (adj[cur] || []).forEach(neighbor => {
      if (!visited.has(neighbor.node) && neighbor.node !== excludeNodeId) {
        visited.add(neighbor.node);
        queue.push(neighbor.node);
      }
    });
  }
  return false;
}

module.exports = {
  buildAdjacencyList,
  checkConnectivity,
  bfsPathExists
};
