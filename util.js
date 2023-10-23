/**
 * @name 验证某点是否在顶点上
 * @param {number [][]} vertexes 顶点坐标数组
 * @param {number} x
 * @param {number} y
 * @param {number} offset 顶点渲染半径
 * @param {object} except_vertexes 需要排除的点
 * @returns {boolean | number} false 或对应的顶点坐标
 */

function verifyIfOnVertex(vertexes, x, y, offset, except_vertexes) {
  let result = false;
  let bigger_offset = 2 * offset;
  for(let i = 0; i < vertexes.length; i++) {
    if((Object.keys(except_vertexes).length == vertexes.length || !except_vertexes[i])
      && x > vertexes[i][0] - bigger_offset && x < vertexes[i][0] + bigger_offset
      && y > vertexes[i][1] - bigger_offset && y < vertexes[i][1] + bigger_offset
    ) {
      result = i;
      break;
    }
  }
  return result;
}

/**
 * @name 在一块画布内生成随机点位
 * @param {number} count
 * @param {number} width
 * @param {number} height
 * @param {number} offset
 */
function createRandomCoordinate(count, width, height, offset) {
  const target = [];
  for(let i = 0; i < count; i++) {
    target[i] = [
      Math.floor(Math.random() * (width - 2 * offset + 1) + offset),
      Math.floor(Math.random() * (height - 2 * offset + 1) + offset)
    ]
  }
  return target;
}

/**
 * @name 多边形生成边路径
 * @param {number} count
 */
 function createPolygonRoutes(count) {
  const target = [];
  for(let i = 0; i < count; i++) {
    target[i] = [ i, i+1 == count ? 0 : i+1 ];
  }
  return target;
}
