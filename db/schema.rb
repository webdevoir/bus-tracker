# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20121130020714) do

  create_table "buses", :force => true do |t|
    t.string   "name"
    t.string   "headsign"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
    t.float    "lat"
    t.float    "lon"
    t.float    "dev"
    t.string   "wmataid"
    t.integer  "busid"
    t.string   "direction"
    t.datetime "last_update"
    t.boolean  "draw"
  end

  create_table "maps", :force => true do |t|
    t.string   "Buses"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "routes", :force => true do |t|
    t.string   "routeid"
    t.string   "direction"
    t.string   "name"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "stop_route", :force => true do |t|
    t.integer "stopid"
    t.integer "routeid"
    t.string  "direction"
    t.integer "seqno"
  end

  create_table "stops", :force => true do |t|
    t.integer "stopid"
    t.string  "name"
    t.string  "wmataid"
    t.float   "lat"
    t.float   "lon"
    t.boolean "draw"
  end

end
