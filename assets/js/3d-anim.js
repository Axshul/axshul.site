document.addEventListener('DOMContentLoaded', () => {
    // 3D Scene Setup
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Remove existing CSS animation from the container to let JS handle it
    container.style.animation = 'none';

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Object: Icosahedron (Techy Sphere)
    const geometry = new THREE.IcosahedronGeometry(2.2, 1);
    const material = new THREE.MeshBasicMaterial({
        color: 0x0044FF, // var(--accent-blue)
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Inner Object: Smaller Sphere for depth
    const innerGeometry = new THREE.IcosahedronGeometry(1.2, 0);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x0044FF,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerSphere);

    // Initial Rotation
    sphere.rotation.x = 0.5;
    sphere.rotation.y = 0.5;

    // Animation Loop
    let targetRotationY = 0;
    let targetRotationX = 0;

    const animate = () => {
        requestAnimationFrame(animate);

        // Constant slow rotation
        sphere.rotation.y += 0.002;
        innerSphere.rotation.y -= 0.002;

        // Scroll influence (Smooth lerp)
        sphere.rotation.y += (targetRotationY - sphere.rotation.y) * 0.05;
        sphere.rotation.x += (targetRotationX - sphere.rotation.x) * 0.05;

        innerSphere.rotation.x += (targetRotationX - innerSphere.rotation.x) * 0.05;

        renderer.render(scene, camera);
    };
    animate();

    // Scroll Listener
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        // Rotate based on scroll amount
        targetRotationY = scrolled * 0.005;
        targetRotationX = scrolled * 0.002;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
});
