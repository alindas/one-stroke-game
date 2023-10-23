
const width = window.innerWidth > 580 ? 580 : window.innerWidth;
const height = window.innerHeight > 580 ? 580 : window.innerHeight;

/** @type{HTMLCanvasElement} */
const canvas = document.getElementById('game');
canvas.width = width;
canvas.height = height;

/** @type{CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
// ctx.globalCompositeOperation = 'destination-over';
ctx.lineCap = 'round';

/** 全局变量 */
const READY = 1;
const GAME_OVER = 2;
const SUCCESS = 3;
const FAIL = 4;
const vertex_color = 'rgb(205, 69, 93)';
const vertex_color_animation = 'rgba(205, 69, 93, .3)';
const vertex_radius = 10;
const line_color_draw = 'rgb(255, 192, 203)';
const line_color = 'rgb(255, 255, 255)';
const line_width = 10;
const top_floor = Math.floor(height / 3);
const middle_floor = Math.floor(height / 3 * 2);
const destroy_color = 'rgba(204, 204, 214, .2)';
let game = null;
let handleMoveSelf = null;
let handleTouchSelf = null;
let handleLiftSelf = null;
let phase = -1;
let vertex_radius_animation = 10;
let vertex_radius_animation_step = 1;
let twinkle_vertex = [];
let animation_switch = -1;
let fall_animation_switch = -1;

/** 图形对象 */
function Graphical() {
  this.polygon = Math.floor(Math.random() * 4 + 3);
  this.coordinate = createRandomCoordinate(this.polygon, width, height, 2 * vertex_radius);
  this.line_combination = createPolygonRoutes(this.polygon); // 封闭图形路线
  this.have_draw_routes = {}; // 已经描绘的路径
  this.have_draw_vertex = {}; // 已经描绘的点
  this.current_draw_vertex = -1; // 当前描绘的顶点
  this.prev_draw_vertex = -1; // 上一个描绘的顶点
  this.initial_draw_vertex = -1; // 描绘的起始点
  this.current_draw_routes = false; // 是否为正确描绘路径
  this.currentX = -1; // 当前笔触
  this.currentY = -1;

  // 画顶点
  function drawVertex(x, y, type = '') {
    if (type == '' && twinkle_vertex.length != 0 && x == twinkle_vertex[0] && y == twinkle_vertex[1]) {
      ctx.beginPath();
      if (vertex_radius_animation > 16 || vertex_radius_animation < 10) {
        vertex_radius_animation_step = -vertex_radius_animation_step;
      }
      vertex_radius_animation += vertex_radius_animation_step;
      ctx.arc(x, y, vertex_radius_animation, 0, Math.PI * 2);
      ctx.fillStyle = vertex_color_animation;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, vertex_radius, 0, Math.PI * 2);
    ctx.fillStyle = type == 'destroy' ? destroy_color : vertex_color;

  }

  // 画边
  function drawLine(x1, y1, x2, y2, type = 'static') {
    ctx.beginPath();
    if(type == 'static') {
      ctx.strokeStyle = line_color;
    }
    else if(type == 'dynamic') {
      ctx.strokeStyle = line_color_draw;
    }
    else if(type == 'destroy') {
      ctx.strokeStyle = destroy_color;
    }
    ctx.lineWidth = line_width;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    // 取消在循环内进行绘制指令，可提高 canvas 性能
    // ctx.stroke();
  }

  // 绘制整个图案
  this.drawPolygon = function () {
    ctx.fillStyle = 'rgba(0, 0, 0, .3)';
    ctx.fillRect(0, 0, width, height);
    this.line_combination.forEach((line, i) => {
      drawLine(...this.coordinate[line[0]], ...this.coordinate[line[1]], this.have_draw_routes[i] ? 'dynamic' : 'static');
      ctx.stroke();
    });
    if (this.current_draw_vertex != -1 && this.currentX != -1) {
      drawLine(...this.coordinate[this.current_draw_vertex], this.currentX, this.currentY, 'dynamic');
      ctx.stroke();
    }
    this.coordinate.forEach(item => {
      drawVertex(...item);
      ctx.fill();
    });
    if (this.have_draw_vertex[this.initial_draw_vertex] == true) {
      clear();
      this.drawPolygonForSuccess();
      // alert('pass!');
      // console.log('pass');
      // start();
    }
    else {
      animation_switch = window.requestAnimationFrame(this.drawPolygon.bind(this));
    }
  }

  // 绘制成功通关后的更新动画
  this.drawPolygonForSuccess = function () {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    let count = 0;
    for(let i = 0; i < this.coordinate.length; i++) {
      if(this.coordinate[i][1] > height) {
        count++;
        continue;
      }
      if(this.coordinate[i][1] < top_floor) {
        this.coordinate[i][1] += 35;
      }
      else if(this.coordinate[i][1] < middle_floor) {
        this.coordinate[i][1] += 20;
      }
      else {
        this.coordinate[i][1] += 10;
      }
    }
    this.line_combination.forEach((line) => {
      drawLine(...this.coordinate[line[0]], ...this.coordinate[line[1]], 'destroy');
      ctx.stroke();
    });
    this.coordinate.forEach(item => {
      drawVertex(...item, 'destroy');
      ctx.fill();
    });
    if(count == this.coordinate.length) {
      ctx.clearRect(0, 0, width, height);
      window.cancelAnimationFrame(fall_animation_switch);
      start();
    }
    else {
      fall_animation_switch = window.requestAnimationFrame(this.drawPolygonForSuccess.bind(this));
    }
  }


  // 处理画布的点击动作
  this.handleTouch = function (e) {
    // 判断当前点击点是否在图案某个顶点上
    let result = verifyIfOnVertex(this.coordinate, e.offsetX, e.offsetY, vertex_radius, this.have_draw_vertex);
    // 如果当前点击点是在顶点上并且该点是起始点或者当前描绘点
    if (result !== false && (this.current_draw_vertex == -1 || result == this.current_draw_vertex)) {
      if (this.current_draw_vertex == -1) {
        this.initial_draw_vertex = result;
      }
      this.current_draw_routes = true;
      this.prev_draw_vertex = this.current_draw_vertex;
      this.current_draw_vertex = result;
      twinkle_vertex = this.coordinate[this.current_draw_vertex];
      // console.log('on point@', this.current_draw_vertex);
      canvas.addEventListener('mousemove', handleMoveSelf);
    }
    else {
      this.current_draw_routes = false;
    }
  }

  handleTouchSelf = this.handleTouch.bind(this);

  this.refreshConnectStatus = function (x, y) {
    let result = verifyIfOnVertex(this.coordinate, x, y, vertex_radius, this.have_draw_vertex);
    // 已滑到顶点则将该线段连接起来(排除起始连接点)
    if (result !== false && result !== this.current_draw_vertex) {
      for (let i = 0; i < this.line_combination.length; i++) {
        if (!this.have_draw_routes[i] && this.line_combination[i].includes(result) && this.line_combination[i].includes(this.current_draw_vertex)) {
          this.have_draw_routes[i] = true;
          this.have_draw_vertex[result] = true;
          this.prev_draw_vertex = this.current_draw_vertex;
          this.current_draw_vertex = result;
          twinkle_vertex = this.coordinate[this.current_draw_vertex];
          break;
        }
      }
    }
  }

  // 处理在画布上的滑动动作
  this.handleMove = function (e) {
    this.currentX = e.offsetX;
    this.currentY = e.offsetY;
    this.refreshConnectStatus(e.offsetX, e.offsetY);
  }

  handleMoveSelf = this.handleMove.bind(this);

  // 处理在画布上松开鼠标动作
  this.handleLift = function () {
    // 如果按下点不是顶点，则抬起时也不需要更新状态值
    if (!this.current_draw_routes) return;
    // 如果当前描点不是已到达终点，则将其已描值重置为 false，为了下一次能从这里继续
    if (!this.have_draw_vertex[this.initial_draw_vertex]) {
      this.have_draw_vertex[this.current_draw_vertex] = false;
    }
    if (this.prev_draw_vertex == -1) {
      this.current_draw_vertex = this.initial_draw_vertex = this.currentX = this.currentY = this.prev_draw_vertex;
    }
    else {
      this.currentX = this.coordinate[this.current_draw_vertex][0];
      this.currentY = this.coordinate[this.current_draw_vertex][1];
    }
    twinkle_vertex = this.current_draw_vertex == -1 ? [] : this.coordinate[this.current_draw_vertex];
    canvas.removeEventListener('mousemove', handleMoveSelf);
  }

  handleLiftSelf = this.handleLift.bind(this);

  this.drawPolygon();

  canvas.addEventListener('mousedown', handleTouchSelf);
  canvas.addEventListener('mouseup', handleLiftSelf);

}

function start() {
  game = new Graphical();
}

function clear() {
  canvas.removeEventListener('mousedown', handleTouchSelf);
  canvas.removeEventListener('mouseup', handleLiftSelf);
  canvas.removeEventListener('mousemove', handleMoveSelf);
  window.cancelAnimationFrame(animation_switch);
  ctx.clearRect(0, 0, width, height);
}

start();



