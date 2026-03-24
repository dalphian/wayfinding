var QRCode=(function(){
"use strict";
/* ---- Reed-Solomon GF(256) ---- */
var EXP=new Uint8Array(256),LOG=new Uint8Array(256);
(function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=285;}EXP[255]=EXP[0];})();
function gfMul(a,b){if(!a||!b)return 0;return EXP[(LOG[a]+LOG[b])%255];}
function gfPoly(n){var p=[1];for(var i=0;i<n;i++){var q=[1,EXP[i]];var r=new Uint8Array(p.length+1);for(var j=0;j<p.length;j++)for(var k=0;k<q.length;k++)r[j+k]^=gfMul(p[j],q[k]);p=Array.from(r);}return p;}
function rsEncode(data,nec){var gen=gfPoly(nec),out=data.slice();out.length+=nec;out.fill(0,data.length);for(var i=0;i<data.length;i++){var c=out[i];if(c)for(var j=0;j<gen.length;j++)out[i+j]^=gfMul(gen[j],c);}return out.slice(data.length);}

/* ---- QR version/capacity tables (byte mode, ECL M) ---- */
// [version, modules, dataCodewords, ecCodewordsPerBlock, blocks]
var VTAB=[
  [1,21,16,10,1],[2,25,28,16,1],[3,29,44,26,1],[4,33,64,18,2],
  [5,37,86,24,2],[6,41,108,16,4],[7,45,124,18,4],[8,49,154,22,4],
  [9,53,182,22,5],[10,57,216,26,5]
];
function getVersion(len){for(var i=0;i<VTAB.length;i++){if(len+3<=VTAB[i][2])return VTAB[i];}return null;}

/* ---- Alignment pattern positions ---- */
var ALIGN=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];

/* ---- Build QR matrix ---- */
function buildMatrix(ver,data){
  var n=ver[1],m=ver[0]-1;
  var mat=[];
  for(var i=0;i<n;i++){mat.push(new Uint8Array(n));} // 0=light, 1=dark, 2=reserved
  var func=[];
  for(var i=0;i<n;i++){func.push(new Uint8Array(n));}

  function setFinder(r,c){
    for(var dr=-1;dr<=7;dr++)for(var dc=-1;dc<=7;dc++){
      if(r+dr<0||r+dr>=n||c+dc<0||c+dc>=n)continue;
      func[r+dr][c+dc]=1;
      var inOuter=(dr==0||dr==6||dc==0||dc==6)&&dr>=-1&&dr<=6&&dc>=-1&&dc<=6;
      var inInner=dr>=2&&dr<=4&&dc>=2&&dc<=4;
      mat[r+dr][c+dc]=(inOuter||inInner)?1:0;
    }
  }
  setFinder(0,0);setFinder(0,n-7);setFinder(n-7,0);

  // Timing
  for(var i=8;i<n-8;i++){func[6][i]=func[i][6]=1;mat[6][i]=mat[i][6]=(i%2==0)?1:0;}

  // Alignment
  var ap=ALIGN[m];
  for(var a=0;a<ap.length;a++)for(var b=0;b<ap.length;b++){
    var cr=ap[a],cc=ap[b];
    if(func[cr][cc])continue;
    for(var dr=-2;dr<=2;dr++)for(var dc=-2;dc<=2;dc++){
      func[cr+dr][cc+dc]=1;
      mat[cr+dr][cc+dc]=(dr==-2||dr==2||dc==-2||dc==2||(dr==0&&dc==0))?1:0;
    }
  }

  // Dark module
  mat[n-8][8]=1;func[n-8][8]=1;

  // Format area
  for(var i=0;i<9;i++){ func[8][i]=1; func[i][8]=1; }
  for(var i=0;i<8;i++){ func[n-1-i][8]=1; func[8][n-1-i]=1; }

  // Place data bits
  var idx=0,bits=[];
  for(var i=0;i<data.length;i++)for(var b=7;b>=0;b--)bits.push((data[i]>>b)&1);
  var col=n-1,dir=-1;
  while(col>0){
    if(col==6)col--;
    for(var row=(dir==-1?n-1:0);dir==-1?row>=0:row<n;row+=dir){
      for(var c2=0;c2<2;c2++){
        var cc=col-c2;
        if(!func[row][cc]){
          mat[row][cc]=(idx<bits.length)?bits[idx++]:0;
        }
      }
    }
    dir=-dir;col-=2;
  }
  return {mat:mat,func:func};
}

/* ---- Masking ---- */
var MASKS=[
  function(r,c){return(r+c)%2==0;},
  function(r,c){return r%2==0;},
  function(r,c){return c%3==0;},
  function(r,c){return(r+c)%3==0;},
  function(r,c){return(Math.floor(r/2)+Math.floor(c/3))%2==0;},
  function(r,c){return(r*c)%2+(r*c)%3==0;},
  function(r,c){return((r*c)%2+(r*c)%3)%2==0;},
  function(r,c){return((r+c)%2+(r*c)%3)%2==0;}
];

// Format string for ECL M + mask pattern
var FMTM=[
  0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0
];
function applyMask(mat,func,mnum,n){
  var fn=MASKS[mnum];
  var m2=[];for(var i=0;i<n;i++)m2.push(mat[i].slice());
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(!func[r][c]&&fn(r,c))m2[r][c]^=1;
  // Write format bits
  var fmt=FMTM[mnum];
  // Area 1: Around top-left finder
  for (var i=0; i<6; i++) m2[8][i] = (fmt >> i) & 1;
  m2[8][7] = (fmt >> 6) & 1;
  m2[8][8] = (fmt >> 7) & 1;
  m2[7][8] = (fmt >> 8) & 1;
  for (var i=0; i<6; i++) m2[5-i][8] = (fmt >> (9+i)) & 1;

  // Area 2: Top-right and bottom-left finders
  for (var i=0; i<8; i++) m2[8][n-1-i] = (fmt >> i) & 1;
  for (var i=0; i<7; i++) m2[n-7+i][8] = (fmt >> (8+i)) & 1;
  return m2;
}

/* ---- Penalty score ---- */
function penalty(mat,n){
  var score=0;
  for(var r=0;r<n;r++){
    var run=1;
    for(var c=1;c<n;c++){
      if(mat[r][c]==mat[r][c-1])run++;
      else{if(run>=5)score+=run-2;run=1;}
    }if(run>=5)score+=run-2;
  }
  for(var c=0;c<n;c++){
    var run=1;
    for(var r=1;r<n;r++){
      if(mat[r][c]==mat[r-1][c])run++;
      else{if(run>=5)score+=run-2;run=1;}
    }if(run>=5)score+=run-2;
  }
  for(var r=0;r<n-1;r++)for(var c=0;c<n-1;c++){
    var v=mat[r][c];
    if(v==mat[r][c+1]&&v==mat[r+1][c]&&v==mat[r+1][c+1])score+=3;
  }
  var dark=0;
  for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(mat[r][c])dark++;
  var pct=dark*100/(n*n),dev=Math.abs(pct-50);
  score+=Math.floor(dev/5)*10;
  return score;
}

/* ---- Encode data ---- */
function encode(text){
  var bytes=[];
  for(var i=0;i<text.length;i++){
    var c=text.charCodeAt(i);
    if(c<128){bytes.push(c);}
    else if(c<2048){bytes.push(0xC0|(c>>6));bytes.push(0x80|(c&63));}
    else{bytes.push(0xE0|(c>>12));bytes.push(0x80|((c>>6)&63));bytes.push(0x80|(c&63));}
  }
  var vt=getVersion(bytes.length);
  if(!vt)return null;
  var ver=vt[0],cap=vt[2],nec=vt[3],blocks=vt[4];

  // Build codeword stream
  var bits=[];
  function addBits(val, len) {
    for (var i=len-1; i>=0; i--) bits.push((val >> i) & 1);
  }
  // Mode (Byte = 0100)
  addBits(4, 4);
  // Length (8 bits for V1-9, 16 bits for V10)
  addBits(bytes.length, ver < 10 ? 8 : 16);
  // Data
  for (var i=0; i<bytes.length; i++) addBits(bytes[i], 8);
  // Terminator
  for (var i=0; i<4 && bits.length < cap*8; i++) bits.push(0);
  // Pad to byte
  while (bits.length % 8 != 0) bits.push(0);
  // Convert to bytes
  var stream=[];
  for (var i=0; i<bits.length; i+=8) {
    var b=0; for (var j=0; j<8; j++) b = (b<<1) | bits[i+j];
    stream.push(b);
  }
  // Padding bytes
  while (stream.length < cap) {
    stream.push(stream.length % 2 == 0 ? 0xEC : 0x11);
  }
  stream=stream.slice(0,cap);

  // Split into blocks + RS
  var dcPerBlock=Math.floor(cap/blocks),extra=cap%blocks;
  var dcBlocks=[],ecBlocks=[];
  var pos=0;
  for(var b=0;b<blocks;b++){
    var len=dcPerBlock+(b>=blocks-extra?1:0);
    var block=stream.slice(pos,pos+len);pos+=len;
    dcBlocks.push(block);
    ecBlocks.push(Array.from(rsEncode(block,nec)));
  }
  // Interleave data
  var out=[];
  var maxDC=Math.max(...dcBlocks.map(b=>b.length));
  for(var i=0;i<maxDC;i++)for(var b=0;b<blocks;b++)if(i<dcBlocks[b].length)out.push(dcBlocks[b][i]);
  for(var i=0;i<nec;i++)for(var b=0;b<blocks;b++)out.push(ecBlocks[b][i]);
  // Remainder bits
  var rem=[0,7,7,7,4,4,4,0,0,0][ver-1]||0;
  for(var i=0;i<rem;i++)out.push(0);

  // Build & mask
  var {mat,func}=buildMatrix(vt,out);
  var n=vt[1];
  var best=null,bestScore=Infinity;
  for(var mask=0;mask<8;mask++){
    var m2=applyMask(mat,func,mask,n);
    var s=penalty(m2,n);
    if(s<bestScore){bestScore=s;best=m2;}
  }
  return {matrix:best,size:n};
}

/* ---- Render ---- */
function render(el,matrix,size,opts){
  var dark=opts.colorDark||'#000',light=opts.colorLight||'#fff';
  var w=opts.width||200,h=opts.height||200;
  var cell=Math.floor(Math.min(w,h)/size);
  var pad=Math.floor((Math.min(w,h)-cell*size)/2);
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">';
  svg+='<rect width="'+w+'" height="'+h+'" fill="'+light+'"/>';
  for(var r=0;r<size;r++)for(var c=0;c<size;c++){
    if(matrix[r][c]){
      svg+='<rect x="'+(pad+c*cell)+'" y="'+(pad+r*cell)+'" width="'+cell+'" height="'+cell+'" fill="'+dark+'"/>';
    }
  }
  svg+='</svg>';
  el.innerHTML=svg;
}

/* ---- Public API (mirrors qrcodejs interface) ---- */
function QRCode(el,opts){
  if(typeof opts==='string')opts={text:opts};
  var result=encode(opts.text);
  if(!result){el.innerHTML='<span style="color:red;font-size:10px">URL too long</span>';return;}
  render(el,result.matrix,result.size,opts);
}
QRCode.CorrectLevel={L:1,M:0,Q:3,H:2};
return QRCode;
})();
