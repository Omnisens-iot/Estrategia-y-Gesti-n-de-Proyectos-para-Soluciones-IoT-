"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRule = exports.getRules = exports.createRule = void 0;
const db_1 = require("../config/db");
const createRule = async (req, reply) => {
    try {
        const { deviceId, metric, threshold, condition, chatId } = req.body;
        if (!deviceId || !metric || threshold === undefined || !condition || !chatId) {
            return reply.status(400).send({ message: 'Missing required fields' });
        }
        const newRule = await db_1.db.insertInto('device_rules')
            .values({
            device_id: deviceId,
            metric: metric,
            threshold: threshold,
            condition: condition,
            chat_id: chatId,
            hysteresis: 0,
            action: 'telegram',
            priority: 1
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return reply.status(201).send(newRule);
    }
    catch (error) {
        console.error('Error creating rule:', error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};
exports.createRule = createRule;
const getRules = async (req, reply) => {
    try {
        const { deviceId } = req.params;
        const rules = await db_1.db.selectFrom('device_rules')
            .selectAll()
            .where('device_id', '=', deviceId)
            .execute();
        return reply.send(rules);
    }
    catch (error) {
        console.error('Error getting rules:', error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};
exports.getRules = getRules;
const deleteRule = async (req, reply) => {
    try {
        const { ruleId } = req.params;
        await db_1.db.deleteFrom('device_rules')
            .where('rule_id', '=', parseInt(ruleId))
            .execute();
        return reply.send({ message: 'Rule deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting rule:', error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};
exports.deleteRule = deleteRule;
