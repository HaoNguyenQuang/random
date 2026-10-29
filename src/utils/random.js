import { POSITIONS } from '../data/champions';
import { TARGET_TIER_PROBS } from '../data/defaultMeta';

export function getSecureRandomInt(min, max) {
  const range = max - min + 1;
  const maxUint32 = 0xFFFFFFFF;
  const limit = maxUint32 - (maxUint32 % range);
  const buffer = new Uint32Array(1);
  let randVal;
  do {
    crypto.getRandomValues(buffer);
    randVal = buffer[0];
  } while (randVal >= limit);
  return min + (randVal % range);
}

export function getSecureRandomFloat() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0x100000000;
}

export function secureShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getHeroTierForLane(heroName, lane, laneMeta) {
  if (!lane || !laneMeta) return 'REMOVED';
  const targetLane = (lane === 'SP') ? 'SUPPORT' : (lane === 'SUPPORT' ? 'SUPPORT' : lane);
  const m = laneMeta[targetLane] || laneMeta[lane];
  if (!m) return 'REMOVED';
  if (m.removed && m.removed.includes(heroName)) return 'REMOVED';
  if (m.S && m.S.includes(heroName)) return 'S';
  if (m.A && m.A.includes(heroName)) return 'A';
  if (m.B && m.B.includes(heroName)) return 'B';
  if (m.C && m.C.includes(heroName)) return 'C';
  if (m.D && m.D.includes(heroName)) return 'D';
  return 'REMOVED';
}

export function computeCandidateWeights(candidates, lane = null, laneMeta = null) {
  const groups = { S: [], A: [], B: [], C: [], D: [] };
  candidates.forEach(c => {
    const t = lane && laneMeta ? getHeroTierForLane(c.name, lane, laneMeta) : (c.tier || 'B');
    if (groups[t]) groups[t].push(c);
    else groups.D.push(c);
  });

  let totalTargetWeight = 0;
  ['S', 'A', 'B', 'C', 'D'].forEach(t => {
    if (groups[t].length > 0) totalTargetWeight += TARGET_TIER_PROBS[t];
  });
  if (totalTargetWeight === 0) totalTargetWeight = 1;

  const weights = new Map();
  ['S', 'A', 'B', 'C', 'D'].forEach(t => {
    const count = groups[t].length;
    if (count > 0) {
      const tierProb = TARGET_TIER_PROBS[t] / totalTargetWeight;
      const champWeight = tierProb / count;
      groups[t].forEach(c => weights.set(c.id, champWeight));
    }
  });

  return { weights, groups };
}

export function weightedMetaShuffle(candidates, lane = null, laneMeta = null) {
  if (candidates.length <= 1) return [...candidates];
  const { weights } = computeCandidateWeights(candidates, lane, laneMeta);

  const scored = candidates.map(c => {
    const w = weights.get(c.id) || 0.0001;
    const u = Math.max(0.0000001, getSecureRandomFloat());
    const key = -Math.log(u) / w;
    return { champ: c, key };
  });
  scored.sort((a, b) => a.key - b.key);
  return scored.map(s => s.champ);
}

export function pickWeightedChampion(candidates, lane = null, laneMeta = null) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  const shuffled = weightedMetaShuffle(candidates, lane, laneMeta);
  return shuffled[0];
}

export function solveTeamMatching({
  players,
  availableChamps,
  disabledHeroIds,
  laneMeta,
  isNoRepeatPrevious,
  lastRolledChampIds,
  lastPlayerRoles
}) {
  const assignedRoles = {};
  const lockedRolesUsed = new Set();

  players.forEach((p, idx) => {
    if (p.lockRole && p.role) {
      assignedRoles[idx] = p.role;
      lockedRolesUsed.add(p.role);
    }
  });

  const freeRoleList = POSITIONS.filter(r => !lockedRolesUsed.has(r));
  const unassignedPlayerIndices = [];
  players.forEach((p, idx) => {
    if (!assignedRoles[idx]) {
      unassignedPlayerIndices.push(idx);
    }
  });

  // Assign roles: when isNoRepeatPrevious is true, ensure player does not repeat previous role
  function assignRolesWithDerangement(pIdxList, availableRoles) {
    if (pIdxList.length === 0) return;

    const shuffledIdxList = secureShuffle(pIdxList);
    const usedRoles = new Set();

    function roleBacktrack(step) {
      if (step === shuffledIdxList.length) return true;
      const pIdx = shuffledIdxList[step];
      const prevRole = (lastPlayerRoles && lastPlayerRoles[pIdx]) || (players[pIdx] && players[pIdx].role);

      let candidateRoles = availableRoles.filter(r => !usedRoles.has(r));
      if (isNoRepeatPrevious && prevRole && candidateRoles.some(r => r !== prevRole)) {
        candidateRoles = candidateRoles.filter(r => r !== prevRole);
      }

      const shuffledCandidates = secureShuffle(candidateRoles);
      for (const role of shuffledCandidates) {
        usedRoles.add(role);
        assignedRoles[pIdx] = role;
        if (roleBacktrack(step + 1)) return true;
        usedRoles.delete(role);
        delete assignedRoles[pIdx];
      }
      return false;
    }

    // Try derangement; if impossible due to locks, assign randomly
    if (!roleBacktrack(0)) {
      const fallbackShuffled = secureShuffle(availableRoles);
      pIdxList.forEach(idx => {
        assignedRoles[idx] = fallbackShuffled.pop();
      });
    }
  }

  assignRolesWithDerangement(unassignedPlayerIndices, freeRoleList);

  const assignedChamps = {};
  const usedChampIds = new Set();

  players.forEach((p, idx) => {
    if (p.lockChamp && p.champId) {
      assignedChamps[idx] = p.champId;
      usedChampIds.add(p.champId);
    }
  });

  const playersToAssign = [];
  for (let i = 0; i < 5; i++) {
    if (!assignedChamps[i]) {
      playersToAssign.push(i);
    }
  }
  const shuffledPlayersToAssign = secureShuffle(playersToAssign);

  function backtrack(idx) {
    if (idx === shuffledPlayersToAssign.length) {
      return true;
    }
    const plIdx = shuffledPlayersToAssign[idx];
    const role = assignedRoles[plIdx];

    // Lọc tướng hợp lệ cho đường này (loại tướng tắt, tướng đang dùng, tướng lần quay trước nếu bật)
    let candidates = availableChamps.filter(c => {
      if (disabledHeroIds.has(c.id) || usedChampIds.has(c.id)) return false;
      if (isNoRepeatPrevious && lastRolledChampIds && lastRolledChampIds.has(c.id)) return false;
      const laneTier = getHeroTierForLane(c.name, role, laneMeta);
      return laneTier !== 'REMOVED';
    });

    // Dự phòng an toàn: nếu do loại tướng lần trước mà đường này không đủ tướng, cho phép dùng lại tướng
    if (candidates.length === 0 && isNoRepeatPrevious) {
      candidates = availableChamps.filter(c => {
        if (disabledHeroIds.has(c.id) || usedChampIds.has(c.id)) return false;
        const laneTier = getHeroTierForLane(c.name, role, laneMeta);
        return laneTier !== 'REMOVED';
      });
    }

    if (candidates.length === 0) return false;

    const shuffledCandidates = weightedMetaShuffle(candidates, role, laneMeta);

    for (const cand of shuffledCandidates) {
      usedChampIds.add(cand.id);
      assignedChamps[plIdx] = cand.id;
      if (backtrack(idx + 1)) {
        return true;
      }
      usedChampIds.delete(cand.id);
      delete assignedChamps[plIdx];
    }
    return false;
  }

  const success = backtrack(0);
  return { success, assignedRoles, assignedChamps };
}
