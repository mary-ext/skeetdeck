import { notifyManager } from '@tanstack/query-core';

import { batch } from 'solid-js';

notifyManager.setScheduler((cb) => cb());
notifyManager.setBatchNotifyFunction(batch);
