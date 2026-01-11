#!/usr/bin/env python3
"""
ADB Bridge Server for Android TV Remote

This WebSocket server acts as a bridge between the web-based remote control
and the Android Debug Bridge (ADB) to control Android TV devices.

Requirements:
- Python 3.7+
- websockets: pip install websockets
- ADB installed and in PATH

Usage:
    python3 adb_bridge.py [--port 8765] [--host 0.0.0.0]
"""

import asyncio
import json
import subprocess
import socket
import argparse
import logging
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict

# Check for websockets library
try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("Please install websockets: pip install websockets")
    exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class Device:
    id: str
    name: str
    ip: str
    port: int
    model: str = ""
    manufacturer: str = ""
    android_version: str = ""

class ADBBridge:
    def __init__(self):
        self.connected_device: Optional[Device] = None
        self.clients: Set[WebSocketServerProtocol] = set()
        
    async def run_adb(self, *args) -> tuple[bool, str]:
        """Run an ADB command and return success status and output."""
        try:
            cmd = ['adb'] + list(args)
            logger.debug(f"Running: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0, result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            return False, "Command timed out"
        except FileNotFoundError:
            return False, "ADB not found. Please install Android SDK Platform Tools."
        except Exception as e:
            return False, str(e)

    async def scan_network(self) -> List[Device]:
        """Scan the local network for Android TV devices."""
        devices = []
        
        # Get local IP to determine network range
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
        except Exception:
            local_ip = "192.168.1.1"
        
        network_prefix = '.'.join(local_ip.split('.')[:-1])
        logger.info(f"Scanning network: {network_prefix}.0/24")
        
        # Scan common ADB ports
        ports = [5555, 5556, 5557]
        
        async def check_host(ip: str, port: int):
            try:
                # Quick TCP connect check
                reader, writer = await asyncio.wait_for(
                    asyncio.open_connection(ip, port),
                    timeout=0.5
                )
                writer.close()
                await writer.wait_closed()
                
                # Try ADB connect
                success, output = await self.run_adb('connect', f'{ip}:{port}')
                if success and 'connected' in output.lower():
                    # Get device info
                    _, model_out = await self.run_adb('-s', f'{ip}:{port}', 'shell', 
                                                       'getprop', 'ro.product.model')
                    _, mfr_out = await self.run_adb('-s', f'{ip}:{port}', 'shell', 
                                                    'getprop', 'ro.product.manufacturer')
                    _, name_out = await self.run_adb('-s', f'{ip}:{port}', 'shell', 
                                                     'settings', 'get', 'global', 'device_name')
                    _, version_out = await self.run_adb('-s', f'{ip}:{port}', 'shell', 
                                                        'getprop', 'ro.build.version.release')
                    
                    device = Device(
                        id=f'{ip}:{port}',
                        name=name_out.strip() or model_out.strip() or f'Android Device ({ip})',
                        ip=ip,
                        port=port,
                        model=model_out.strip(),
                        manufacturer=mfr_out.strip(),
                        android_version=version_out.strip()
                    )
                    devices.append(device)
                    logger.info(f"Found device: {device.name} at {ip}:{port}")
                    
                    # Disconnect after scanning (we'll reconnect when user selects)
                    await self.run_adb('disconnect', f'{ip}:{port}')
            except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
                pass

        # Scan all IPs in parallel
        tasks = []
        for i in range(1, 255):
            ip = f"{network_prefix}.{i}"
            for port in ports:
                tasks.append(check_host(ip, port))
        
        await asyncio.gather(*tasks)
        return devices

    async def connect_device(self, device: Device) -> bool:
        """Connect to a specific device."""
        success, output = await self.run_adb('connect', f'{device.ip}:{device.port}')
        if success and 'connected' in output.lower():
            self.connected_device = device
            logger.info(f"Connected to {device.name}")
            return True
        logger.error(f"Failed to connect: {output}")
        return False

    async def disconnect_device(self):
        """Disconnect from current device."""
        if self.connected_device:
            await self.run_adb('disconnect', f'{self.connected_device.ip}:{self.connected_device.port}')
            logger.info(f"Disconnected from {self.connected_device.name}")
            self.connected_device = None

    async def send_key(self, keycode: str) -> bool:
        """Send a keycode to the device."""
        if not self.connected_device:
            return False
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'keyevent', keycode
        )
        return success

    async def send_text(self, text: str) -> bool:
        """Send text input to the device."""
        if not self.connected_device:
            return False
        # Escape special characters
        escaped = text.replace(' ', '%s').replace("'", "\\'").replace('"', '\\"')
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'text', escaped
        )
        return success

    async def move_cursor(self, dx: int, dy: int) -> bool:
        """Move the cursor/pointer on screen."""
        if not self.connected_device:
            return False
        # Use swipe with same start/end for movement simulation
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'swipe', 
            str(500), str(500), str(500 + dx), str(500 + dy), '50'
        )
        return success

    async def tap(self, x: int = 540, y: int = 960) -> bool:
        """Tap at screen coordinates."""
        if not self.connected_device:
            return False
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'tap', str(x), str(y)
        )
        return success

    async def scroll(self, delta_y: int) -> bool:
        """Scroll vertically."""
        if not self.connected_device:
            return False
        direction = 1 if delta_y > 0 else -1
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'swipe', 
            '540', '960', '540', str(960 - direction * 200), '100'
        )
        return success

    async def get_installed_apps(self) -> List[Dict]:
        """Get list of installed apps."""
        if not self.connected_device:
            return []
        
        apps = []
        
        # Get third-party apps
        success, output = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'pm', 'list', 'packages', '-3'
        )
        
        if success:
            for line in output.strip().split('\n'):
                if line.startswith('package:'):
                    package = line.replace('package:', '').strip()
                    # Get app label
                    _, label_out = await self.run_adb(
                        '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
                        'shell', 'cmd', 'package', 'dump', package
                    )
                    
                    # Try to extract label from dump (simplified)
                    label = package.split('.')[-1].replace('_', ' ').title()
                    
                    apps.append({
                        'packageName': package,
                        'label': label,
                        'isSystem': False
                    })
        
        return apps

    async def launch_app(self, package_name: str) -> bool:
        """Launch an app by package name."""
        if not self.connected_device:
            return False
        
        # Try to find the main launcher activity
        success, output = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'monkey', '-p', package_name, '-c',
            'android.intent.category.LAUNCHER', '1'
        )
        return success

    async def power_off(self) -> bool:
        """Power off the device."""
        if not self.connected_device:
            return False
        success, _ = await self.run_adb(
            '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
            'shell', 'input', 'keyevent', 'KEYCODE_POWER'
        )
        return success

    async def take_screenshot(self) -> Optional[bytes]:
        """Capture a screenshot from the device."""
        if not self.connected_device:
            return None
        
        try:
            # Take screenshot and get raw PNG data
            cmd = ['adb', '-s', f'{self.connected_device.ip}:{self.connected_device.port}',
                   'exec-out', 'screencap', '-p']
            result = subprocess.run(cmd, capture_output=True, timeout=15)
            
            if result.returncode == 0 and result.stdout:
                logger.info("Screenshot captured successfully")
                return result.stdout
            else:
                logger.error(f"Screenshot failed: {result.stderr.decode()}")
                return None
        except Exception as e:
            logger.error(f"Screenshot error: {e}")
            return None

    async def send_wake_on_lan(self, mac_address: str) -> bool:
        """Send a Wake-on-LAN magic packet."""
        try:
            # Clean MAC address
            mac = mac_address.replace(':', '').replace('-', '').upper()
            if len(mac) != 12:
                logger.error(f"Invalid MAC address: {mac_address}")
                return False
            
            # Create magic packet
            mac_bytes = bytes.fromhex(mac)
            magic_packet = b'\xff' * 6 + mac_bytes * 16
            
            # Send to broadcast address on port 9
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.sendto(magic_packet, ('255.255.255.255', 9))
            sock.close()
            
            logger.info(f"Wake-on-LAN packet sent to {mac_address}")
            return True
        except Exception as e:
            logger.error(f"Wake-on-LAN error: {e}")
            return False

    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            response = {'type': msg_type}
            
            if msg_type == 'scan':
                devices = await self.scan_network()
                response = {
                    'type': 'scan_result',
                    'devices': [asdict(d) for d in devices]
                }
            
            elif msg_type == 'connect':
                device_data = data.get('device', {})
                device = Device(
                    id=device_data.get('id', ''),
                    name=device_data.get('name', ''),
                    ip=device_data.get('ip', ''),
                    port=device_data.get('port', 5555),
                    model=device_data.get('model', ''),
                    manufacturer=device_data.get('manufacturer', ''),
                    android_version=device_data.get('androidVersion', '')
                )
                success = await self.connect_device(device)
                if success:
                    response = {
                        'type': 'connected',
                        'device': asdict(self.connected_device)
                    }
                else:
                    response = {
                        'type': 'error',
                        'message': 'Failed to connect to device'
                    }
            
            elif msg_type == 'disconnect':
                await self.disconnect_device()
                response = {'type': 'disconnected'}
            
            elif msg_type == 'key':
                keycode = data.get('keyCode', '')
                success = await self.send_key(keycode)
                response = {'type': 'key_sent', 'success': success}
            
            elif msg_type == 'text':
                text = data.get('text', '')
                success = await self.send_text(text)
                response = {'type': 'text_sent', 'success': success}
            
            elif msg_type == 'cursor':
                dx = data.get('x', 0)
                dy = data.get('y', 0)
                await self.move_cursor(int(dx), int(dy))
                response = {'type': 'cursor_moved'}
            
            elif msg_type == 'tap':
                await self.tap()
                response = {'type': 'tapped'}
            
            elif msg_type == 'scroll':
                delta_y = data.get('deltaY', 0)
                await self.scroll(int(delta_y))
                response = {'type': 'scrolled'}
            
            elif msg_type == 'get_apps':
                apps = await self.get_installed_apps()
                response = {'type': 'apps', 'apps': apps}
            
            elif msg_type == 'launch':
                package = data.get('packageName', '')
                success = await self.launch_app(package)
                response = {'type': 'launched', 'success': success}
            
            elif msg_type == 'power_off':
                success = await self.power_off()
                response = {'type': 'powered_off', 'success': success}
            
            elif msg_type == 'screenshot':
                import base64
                screenshot_data = await self.take_screenshot()
                if screenshot_data:
                    response = {
                        'type': 'screenshot',
                        'success': True,
                        'data': base64.b64encode(screenshot_data).decode('utf-8')
                    }
                else:
                    response = {'type': 'screenshot', 'success': False}
            
            elif msg_type == 'wake_on_lan':
                mac = data.get('macAddress', '')
                success = await self.send_wake_on_lan(mac)
                response = {'type': 'wol_sent', 'success': success}
            
            await websocket.send(json.dumps(response))
            
        except json.JSONDecodeError:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def handler(self, websocket: WebSocketServerProtocol):
        """Handle WebSocket connections."""
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            logger.info(f"Client disconnected. Total clients: {len(self.clients)}")


async def main():
    parser = argparse.ArgumentParser(description='ADB Bridge Server for Android TV Remote')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8765, help='Port to bind to (default: 8765)')
    args = parser.parse_args()
    
    bridge = ADBBridge()
    
    logger.info(f"Starting ADB Bridge Server on ws://{args.host}:{args.port}")
    logger.info("Make sure ADB is installed and in your PATH")
    logger.info("Press Ctrl+C to stop")
    
    async with websockets.serve(bridge.handler, args.host, args.port):
        await asyncio.Future()  # Run forever


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped")
