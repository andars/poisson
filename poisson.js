var canvas = document.querySelector('#voltage_viewer');
var ctx = canvas.getContext('2d');
var canvas_e = document.querySelector('#efield_viewer');
var ctxe = canvas_e.getContext('2d');

var grid_width = 200;
var grid_height = 200;
var egrid_width = grid_width - 1;
var egrid_height = grid_height - 1;
var block_width = 1;
var block_height = 1;

var t = Math.cos(Math.PI/grid_width) + Math.cos(Math.PI/grid_height);
var w = (8 - Math.sqrt(64 - 16*t*t))/(t*t);
console.log(w);

canvas.width = grid_width * block_width;
canvas.height = grid_height * block_height;

canvas_e.width = grid_width * block_width;
canvas_e.height = grid_height * block_height;


var eps0 = 8.85e-12;

var h = 0.001;
var r;
var grid = new Float32Array(grid_width * grid_height);
var Ex = new Float32Array(egrid_width * egrid_height);
var Ey = new Float32Array(egrid_width * egrid_height);


var tmp;
var setpoints = new Float32Array(grid_width * grid_height);
var charge_density = new Float32Array(grid_width * grid_height);

function voltage_block(grid, xmin, ymin, width, height, voltage) {
    for (var x = xmin; x < xmin + width; x++) {
        for (var y = ymin; y < ymin + height; y++) {
            setpoints[y*grid_width + x] = voltage;
            grid[y*grid_width + x] = voltage;
        }
    }
}


function interpolate( val, y0, x0, y1, x1 ) {
    return (val-x0)*(y1-y0)/(x1-x0) + y0;
}

function base(val) {
    if ( val <= -0.75 ) return 0;
    else if ( val <= -0.25 ) return interpolate( val, 0.0, -0.75, 1.0, -0.25 );
    else if ( val <= 0.25 ) return 1.0;
    else if ( val <= 0.75 ) return interpolate( val, 1.0, 0.25, 0.0, 0.75 );
    else return 0.0;
}

function get_rgb(s) {
  r = Math.round(255*base(s - 0.5));
  g = Math.round(255*base(s));
  b = Math.round(255*base(s + 0.5));
  return "rgba("+r+","+g+","+b+","+(255)+")";
}

function render_viewer(ctx, grid) {
    var min = 0;
    var max = 0;

    var mine = 0;
    var maxe = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // re-compute electric field
    for (var y = 0; y < egrid_height; y++) {
        for (var x = 0; x < egrid_width; x++) {
        Ex[y * egrid_height + x] = -(grid[y * grid_height + x + 1] - grid[y * grid_height + x])/h;
        Ey[y * egrid_height + x] = -(grid[(y+1) * grid_height + x] - grid[y * grid_height + x])/h;
        }
    }


    for (var i = 0; i < grid_height; i++) {
        for (var j = 0; j < grid_width; j++) {
            var v = grid[i*grid_width + j];
            if (v < min) {
                min = v;
            }
            if (v > max) {
                max = v;
            }

            var ex1 = Ex[i*egrid_width + j];
            var ex2 = Ex[i*egrid_width + j + 1];
            var ey1 = Ey[i*egrid_width + j];
            var ey2 = Ey[(i+1)*egrid_width + j];

            var ex = 0.5*(ex1 + ex2);
            var ey = 0.5*(ey1 + ey2);

            var e = Math.pow(ex*ex + ey*ey, 0.5);

            if (e < mine) {
                mine = e;
            }
            if (e > maxe) {
                maxe = e;
            }
        }
    }

    for (var i = 0; i < grid_height; i++) {
        for (var j = 0; j < grid_width; j++) {
            v = 2*(grid[i*grid_width + j] - min)/(max - min) - 1;
            ctx.fillStyle = get_rgb(v);
            ctx.fillRect(block_width*j, block_height*i, block_width, block_height);
        }
    }

    for (var i = 1; i < grid_height-1; i+=1) {
        for (var j = 1; j < grid_width-1; j+=1) {
            var ex1 = Ex[i*egrid_width + j];
            var ex2 = Ex[i*egrid_width + j + 1];
            var ey1 = Ey[i*egrid_width + j];
            var ey2 = Ey[(i+1)*egrid_width + j];

            var ex = 0.5*(ex1 + ex2);
            var ey = 0.5*(ey1 + ey2);

            var e = 2*(Math.pow(ex*ex + ey*ey, 0.5) - mine)/(maxe - mine) - 1;

            ctxe.fillStyle = get_rgb(e);
            ctxe.fillRect(block_width*j, block_height*i, block_width, block_height);
        }
    }

    for (var i = 5; i < grid_height; i+=0.05*grid_height) {
        for (var j = 5; j < grid_width; j+=0.05*grid_width) {
            var ex1 = Ex[i*egrid_width + j];
            var ex2 = Ex[i*egrid_width + j + 1];
            var ey1 = Ey[i*egrid_width + j];
            var ey2 = Ey[(i+1)*egrid_width + j];

            var ex = 0.5*(ex1 + ex2);
            var ey = 0.5*(ey1 + ey2);

            var startx = block_width*(j-0.5);
            var starty = block_height*(i-0.5);

            ctx.strokeStyle = 'rgba(255,255,255,255)';
            ctx.beginPath();
            ctx.moveTo(startx, starty);
            ctx.lineTo(startx + 20/maxe*ex, starty + 20/maxe*ey);
            ctx.stroke();
        }
    }
}


var xmin = Math.round(0.3*grid_width);
var xmax = Math.round(0.7*grid_width);
var ymin = Math.round(0.51*grid_height);
var ymax = Math.round(0.53*grid_height);
var V = 10;
voltage_block(grid, xmin, ymin, xmax-xmin, ymax-ymin, V);

ymin = Math.round(0.58*grid_height);
ymax = Math.round(0.60*grid_height);
voltage_block(grid, xmin, ymin, xmax-xmin, ymax-ymin, -V);

ymin = Math.round(0.63*grid_height);
ymax = Math.round(0.65*grid_height);
voltage_block(grid, xmin, ymin, xmax-xmin, ymax-ymin, V);

charge_density[0.2*grid_height*grid_width + 0.7*grid_width] = 1e-4;
charge_density[0.2*grid_height*grid_width + 0.3*grid_width] = -1e-4;

function update_grid() {
  // update voltages

  var residual = 0;
  for (var y = 0; y < grid_height; y++) { // row
    for (var x = 0; x < grid_width; x++) { // column
      var setpoint = setpoints[y * grid_width + x];

      if (x > 0 && x < grid_width-1 && y > 0 && y < grid_height-1
          && setpoint === 0) {

        // interior node
        residual = (grid[(y-1) * grid_width + x] +
                    grid[(y+1) * grid_width + x] +
                    grid[y * grid_width + (x-1)] +
                    grid[y * grid_width + (x+1)] +
                    charge_density[y * grid_width + x]*h*h/eps0)/4.0
                 - grid[y * grid_width + x];

        /*
        if (y === ymax+1 && x === xmin-1) {
            console.log(grid[(y-1) * grid_width + x]);
            console.log(grid[(y+1) * grid_width + x]);
            console.log(grid[(y) * grid_width + x-1]);
            console.log(grid[(y) * grid_width + x+1]);
            console.log(r);
            console.log('---');
        }
        */
        grid[y * grid_width + x] = grid[y*grid_width + x] + w*residual;
      }
    }
  }

}

var iter = 0;
function update() {
    console.log('update: ' + iter);
    if (iter % 5 === 0) {
        update_grid();
    }
    render_viewer(ctx, grid);

    iter += 1;
}

setInterval(update, 10);
