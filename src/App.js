import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, useCursor } from '@react-three/drei'
import { useControls } from 'leva'
import create from 'zustand'
import debounce from 'lodash.debounce'

const useStore = create((set) => ({ target: null, setTarget: (target) => set({ target }) }))

function Box(props) {
  const setTarget = useStore((state) => state.setTarget)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <mesh {...props} onClick={(e) => setTarget(e.object)} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry />
      <meshNormalMaterial />
    </mesh>
  )
}

export default function App() {
  const { target, setTarget } = useStore()

  const transformRef = useRef(null)

  const [{ mode }] = useControls(() => ({
    mode: {
      value: 'translate',
      options: ['translate', 'rotate', 'scale']
    }
  }))

  const [{ position, rotation }, setTransform] = useControls(() => ({
    position: {
      value: [0, 0, 0]
    },
    rotation: {
      value: [0, 0, 0]
    }
  }))

  useEffect(() => {
    if (!target) return

    const debouncedSetTransform = debounce((pos, rot) => {
      console.log('controls updated')
      setTransform({
        position: pos,
        rotation: rot
      })
    }, 10)

    const onObjectChange = () => {
      console.log('object changed')
      debouncedSetTransform(
        [target.position.x, target.position.y, target.position.z],
        [target.rotation._x, target.rotation._y, target.rotation._z]
      )
    }

    transformRef.current.addEventListener('objectChange', onObjectChange)

    return () => {
      if (transformRef.current) {
        debouncedSetTransform.cancel()
        transformRef.current.removeEventListener('objectChange', onObjectChange)
      }
    }
  }, [target])

  return (
    <Canvas dpr={[1, 2]} onPointerMissed={() => setTarget(null)}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <Box position={position} rotation={rotation} />
      {target && <TransformControls ref={transformRef} object={target} mode={mode} />}
      <OrbitControls makeDefault />
    </Canvas>
  )
}
