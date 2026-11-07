import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";

const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uPointer;
uniform float uTime;
uniform float uIntro;
varying vec2 vUv;

const float OVERSCAN = 1.14;

vec4 sampleColor(vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uColor, uv);
}

void main() {
  // 가장자리가 잘리지 않도록 좌우와 위에 여백을 둡니다. 아래는 화면 밖으로 이어집니다.
  vec2 uv = vec2((vUv.x - 0.5) * OVERSCAN + 0.5, vUv.y * OVERSCAN);
  float depth = texture2D(uDepth, clamp(uv, 0.0, 1.0)).r;

  vec2 sway = vec2(sin(uTime * 0.5), cos(uTime * 0.37)) * 0.05;
  vec2 pointer = uPointer + sway;
  vec2 offset = pointer * (depth - 0.32) * 0.05;
  float split = 0.0006 + length(uPointer) * 0.0016;
  vec2 direction = normalize(pointer + vec2(0.001));

  vec4 centre = sampleColor(uv - offset);
  float red = sampleColor(uv - offset + direction * split).r;
  float blue = sampleColor(uv - offset - direction * split).b;
  vec3 color = vec3(red, centre.g, blue);
  float alpha = centre.a;

  // 깊이 경사로 면을 추정해 마우스 쪽에서 빛이 오는 것처럼 비춥니다.
  float dx = texture2D(uDepth, uv + vec2(0.012, 0.0)).r - texture2D(uDepth, uv - vec2(0.012, 0.0)).r;
  float dy = texture2D(uDepth, uv + vec2(0.0, 0.012)).r - texture2D(uDepth, uv - vec2(0.0, 0.012)).r;
  vec3 normal = normalize(vec3(-dx * 7.0, -dy * 7.0, 1.0));
  vec3 lightDir = normalize(vec3(pointer * 1.3, 0.9));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float rim = pow(1.0 - clamp(depth * 1.6, 0.0, 1.0), 1.5);

  color *= mix(0.42, 1.12, diffuse);
  vec3 warm = mix(vec3(1.0, 0.39, 0.52), vec3(0.95, 0.70, 0.40), pointer.x * 0.5 + 0.5);
  color += warm * rim * diffuse * 0.5;

  // 등장: 아래에서 위로 드러납니다.
  float reveal = smoothstep(uIntro * 1.3 - 0.3, uIntro * 1.3, 1.0 - uv.y + 0.0);
  alpha *= 1.0 - reveal;

  gl_FragColor = vec4(color * alpha, alpha);
}
`;

function loadTexture(renderer: Renderer, src: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const texture = new Texture(renderer.gl, {
        image,
        premultiplyAlpha: false,
        generateMipmaps: false,
        minFilter: renderer.gl.LINEAR,
        magFilter: renderer.gl.LINEAR,
      });
      resolve(texture);
    };
    image.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${src}`));
    image.src = src;
  });
}

export type ChefRenderer = {
  canvas: HTMLCanvasElement;
  render: (input: { pointerX: number; pointerY: number; time: number; intro: number }) => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
};

/** 인물 컷아웃과 깊이 지도로 2.5D 시차를 그리는 WebGL 렌더러입니다. WebGL이 없으면 예외를 던집니다. */
export async function createChefRenderer(colorSrc: string, depthSrc: string): Promise<ChefRenderer> {
  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    dpr: Math.min(window.devicePixelRatio, 1.75),
  });
  const { gl } = renderer;
  gl.clearColor(0, 0, 0, 0);
  const [uColor, uDepth] = await Promise.all([
    loadTexture(renderer, colorSrc),
    loadTexture(renderer, depthSrc),
  ]);
  const program = new Program(gl, {
    vertex: VERTEX,
    fragment: FRAGMENT,
    transparent: true,
    uniforms: {
      uColor: { value: uColor },
      uDepth: { value: uDepth },
      uPointer: { value: [0, 0] },
      uTime: { value: 0 },
      uIntro: { value: 1 },
    },
  });
  // 미리 곱한 알파로 출력합니다.
  program.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  return {
    canvas: gl.canvas,
    render: ({ pointerX, pointerY, time, intro }) => {
      program.uniforms.uPointer!.value = [pointerX, pointerY];
      program.uniforms.uTime!.value = time;
      program.uniforms.uIntro!.value = intro;
      renderer.render({ scene: mesh });
    },
    resize: (width, height) => renderer.setSize(width, height),
    destroy: () => {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
    },
  };
}
