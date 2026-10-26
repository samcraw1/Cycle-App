// Pin the timezone so date tests exercise DST transitions deterministically.
module.exports = async () => {
  process.env.TZ = 'America/New_York';
};
