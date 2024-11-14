# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2024-11-13 12:02
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Topic',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.CharField(max_length=255, unique=True)),
                ('en_title', models.CharField(blank=True, default='', max_length=255)),
                ('he_title', models.CharField(blank=True, default='', max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name='TopicPool',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
            ],
        ),
        migrations.AddField(
            model_name='topic',
            name='pools',
            field=models.ManyToManyField(related_name='topics', to='topics.TopicPool'),
        ),
    ]
