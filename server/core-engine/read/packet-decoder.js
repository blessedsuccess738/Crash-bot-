export class PacketDecoder {
  decode(payload) {
    try {
      if (typeof payload === 'string' && payload.startsWith('42')) {
        return JSON.parse(payload.substring(2));
      }
      return payload;
    } catch (e) {
      return null;
    }
  }
}
